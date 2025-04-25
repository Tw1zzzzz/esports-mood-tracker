import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../middleware/types';

/**
 * Схема пользователя для MongoDB
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Имя пользователя обязательно'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Пожалуйста, укажите корректный email']
    },
    password: {
      type: String,
      required: [true, 'Пароль обязателен'],
      minlength: [6, 'Пароль должен быть не менее 6 символов']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isStaff: {
      type: Boolean,
      default: false
    },
    faceitAccountId: {
      type: String,
      default: null
    },
    completedTests: {
      type: [String],
      default: []
    },
    completedBalanceWheel: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        delete ret.password;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function (_, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

// Виртуальное поле для совместимости
userSchema.virtual('id').get(function (this: IUser) {
  return this._id.toString();
});

/**
 * Хеширование пароля перед сохранением
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Метод для сравнения введенного пароля с хешированным
 */
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Проверка на совпадение с паролем (для обратной совместимости)
 */
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return this.comparePassword(enteredPassword);
};

/**
 * Модель пользователя
 */
const User = mongoose.model<IUser>('User', userSchema);

export default User; 