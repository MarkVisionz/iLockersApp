const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const moment = require('moment');
const logger = require('../utils/logger');

const User = require('../models/user');
const LaundryNote = require('../models/laundryNote');
const { auth, isUser, isAdmin, guestAuth } = require('../middleware/auth');

const generateVerificationToken = (userId) =>
  jwt.sign({ userId, type: 'verify' }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' });

const signJwt = (user) =>
  jwt.sign(
    {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      authProvider: user.authProvider,
      isVerified: user.isVerified,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY
  );

// 🔄 Convertir usuario invitado a regular
router.post('/convert-guest', guestAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, role } = req.body;

    if (!email || !password || !['customer', 'owner'].includes(role)) {
      throw new Error('Campos inválidos');
    }

    const existingUser = await User.findOne({ email, isGuest: false }).session(session);
    if (existingUser) throw new Error('El correo ya está en uso');

    const user = await User.findByIdAndUpdate(
      req.guest._id,
      {
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        isGuest: false,
        authProvider: 'password',
        isVerified: false,
        role,
        registrationStep: role === 'owner' ? 'email_verification' : 'completed',
        $unset: { guestExpiresAt: '' },
      },
      { new: true, session }
    );

    await LaundryNote.updateMany(
      { guestId: req.guest._id },
      { $set: { userId: user._id, isGuestOrder: false }, $unset: { guestId: '' } },
      { session }
    );

    const verificationToken = generateVerificationToken(user._id);

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      token: signJwt(user),
      user,
      requiresVerification: true,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error en convert-guest:', { message: error.message });
    res.status(500).json({ success: false, message: 'Error al convertir usuario', code: 'CONVERSION_ERROR' });
  } finally {
    session.endSession();
  }
});

// 🔐 Registro con Firebase/email/password
router.post('/firebase-register', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, name, password, role, firebaseUid } = req.body;

    if (!email || !name || !password || !['customer', 'owner'].includes(role)) {
      throw new Error('Faltan campos requeridos o rol inválido');
    }

    let user = await User.findOne({ email }).session(session);

    if (user && !user.isGuest) {
      throw new Error('El correo ya está registrado');
    }

    if (user?.isGuest) {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: await bcrypt.hash(password, 10),
          isVerified: false,
          isGuest: false,
          authProvider: 'password',
          role,
          registrationStep: role === 'owner' ? 'email_verification' : 'completed',
          firebaseUid,
          $unset: { guestExpiresAt: '' },
        },
        { new: true, session }
      );
    } else {
      user = new User({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password: await bcrypt.hash(password, 10),
        isVerified: false,
        isGuest: false,
        authProvider: 'password',
        role,
        registrationStep: role === 'owner' ? 'email_verification' : 'completed',
        firebaseUid
      });
      await user.save({ session });
    }

    await LaundryNote.updateMany(
      { 'contact.email': email, userId: null, isGuestOrder: true },
      { $set: { userId: user._id, isGuestOrder: false }, $unset: { guestId: '' } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      token: signJwt(user),
      user,
      requiresVerification: true,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Register Error:', { message: error.message });
    res.status(500).json({ success: false, message: error.message || 'Error al registrar usuario' });
  } finally {
    session.endSession();
  }
});

// 🔑 Login con Firebase
router.post('/firebase-login', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token, name: userName } = req.body;
    if (!token) throw new Error('Token requerido');

    const decoded = await admin.auth().verifyIdToken(token, true);
    const { email, email_verified } = decoded;
    const authProvider = decoded.firebase?.sign_in_provider || 'password';
    const isOAuth = ['google.com', 'facebook.com'].includes(authProvider);
    const isVerified = isOAuth || email_verified;

    if (!isVerified && authProvider === 'password') {
      throw new Error('Email no verificado');
    }

    let user = await User.findOne({ email }).session(session);
    const displayName = userName || decoded.name || email.split('@')[0];
    let isNew = false;

    if (!user) {
      user = new User({
        name: displayName,
        email,
        password: 'firebase_oauth',
        isVerified,
        isGuest: false,
        authProvider,
        role: 'customer',
        registrationStep: 'completed',
      });
      await user.save({ session });
      isNew = true;
    } else if (user.isGuest) {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          authProvider,
          isGuest: false,
          isVerified,
          name: displayName,
          password: 'firebase_oauth',
          $unset: { guestExpiresAt: '' },
        },
        { new: true, session }
      );
    } else if (userName && user.name !== userName) {
      user = await User.findByIdAndUpdate(user._id, { name: userName }, { new: true, session });
    }

    await LaundryNote.updateMany(
      { 'contact.email': email, userId: null, isGuestOrder: true },
      { $set: { userId: user._id, isGuestOrder: false }, $unset: { guestId: '' } },
      { session }
    );

    await session.commitTransaction();

    if (isNew && req.io) {
      req.io.emit('userCreated', {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        authProvider: user.authProvider,
        role: user.role,
      });
    }

    res.status(200).json({ success: true, token: signJwt(user), user });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Login Error:', { message: error.message });
    res.status(500).json({ success: false, message: error.message || 'Error en login' });
  } finally {
    session.endSession();
  }
});

// 📩 Verificación de email
router.post('/verify-email', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const firebaseUser = await admin.auth().getUserByEmail(email);
    
    if (!firebaseUser.emailVerified) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Email no verificado en Firebase' });
    }

    const nextStep = user.role === 'owner' ? 'business_setup' : 'completed';
    
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { 
        isVerified: true,
        registrationStep: nextStep,
        lastLogin: new Date()
      },
      { new: true, session }
    );

    const tokenJWT = signJwt(updatedUser);

    await session.commitTransaction();
    res.status(200).json({ 
      success: true, 
      token: tokenJWT, 
      user: updatedUser,
      nextStep
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Verify Email Error:', { message: error.message });
    res.status(500).json({ success: false, message: error.message || 'Error al verificar email' });
  } finally {
    session.endSession();
  }
});

// 🔄 Convertir usuario invitado a regular
router.post('/convert-guest', guestAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, role } = req.body;

    if (!email || !password || !['customer', 'owner'].includes(role)) {
      throw new Error('Campos inválidos');
    }

    const existingUser = await User.findOne({ email, isGuest: false }).session(session);
    if (existingUser) throw new Error('El correo ya está en uso');

    const user = await User.findByIdAndUpdate(
      req.guest._id,
      {
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        isGuest: false,
        authProvider: 'password',
        isVerified: false,
        role,
        registrationStep: role === 'owner' ? 'email_verification' : 'completed',
        $unset: { guestExpiresAt: '' },
      },
      { new: true, session }
    );

    await LaundryNote.updateMany(
      { guestId: req.guest._id },
      { $set: { userId: user._id, isGuestOrder: false }, $unset: { guestId: '' } },
      { session }
    );

    const verificationToken = generateVerificationToken(user._id);
    // TODO: enviar email

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      token: signJwt(user),
      user,
      requiresVerification: true,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error en convert-guest:', { message: error.message });
    res.status(500).json({ success: false, message: 'Error al convertir usuario', code: 'CONVERSION_ERROR' });
  } finally {
    session.endSession();
  }
});

// 👤 CRUD y stats
router.get('/', isAdmin, async (req, res) => {
  const users = await User.find().select('-password').sort({ _id: -1 });
  res.status(200).json({ success: true, users });
});

router.delete('/:id', isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  if (user.isAdmin) {
    return res.status(403).json({ success: false, message: 'No puedes eliminar un administrador' });
  }

  await User.deleteOne({ _id: user._id });
  res.status(200).json({ success: true, message: 'Usuario eliminado' });
});

router.put('/:id', isUser, async (req, res) => {
  const { name, email, newPassword, currentPassword, profileImage } = req.body;
  const user = await User.findById(req.params.id).select('+password');

  if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

  if (email && email !== user.email) {
    const emailInUse = await User.findOne({ email });
    if (emailInUse) return res.status(400).json({ success: false, message: 'Email en uso' });
    user.email = email.trim().toLowerCase();
  }

  if (newPassword && user.authProvider === 'password') {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Contraseña actual inválida' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  if (name) user.name = name.trim();
  if (profileImage) user.profileImage = profileImage;

  await user.save();

  res.status(200).json({ success: true, user });
});

router.get('/stats', isAdmin, async (req, res) => {
  const previousMonth = moment().subtract(1, 'month').startOf('month').toDate();

  const stats = await User.aggregate([
    { $match: { createdAt: { $gte: previousMonth } } },
    { $project: { month: { $month: '$createdAt' } } },
    { $group: { _id: '$month', total: { $sum: 1 } } },
  ]);

  res.status(200).json({ success: true, stats });
});

// GET /api/users/:id - Obtener datos de un usuario específico
router.get('/:id', auth, async (req, res, next) => {
  try {
    // Verificar que el usuario autenticado solo pueda acceder a sus propios datos
    if (req.user._id.toString() !== req.params.id && !req.user.isAdmin) {
      return next(createError(403, 'Acceso denegado'));
    }

    const user = await User.findById(req.params.id)
      .populate('businesses')
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return next(createError(404, 'Usuario no encontrado'));
    }

    res.json({ user });
  } catch (error) {
    next(createError(500, 'Error al obtener usuario'));
  }
});

module.exports = router;
