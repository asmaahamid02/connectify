import { Request, Response } from 'express'
import User from '../models/user.model'
import { getErrorMessage } from '../utils/error.util'
import { IUserRequest } from '../types/user.type'
import { validateSignupRequest } from '../utils/authValidation.util'
import bcrypt from 'bcryptjs'
import { createToken } from '../utils/jwt.util'
import { validateRequiredFields } from '../utils/validation.util'

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, username, password, gender }: IUserRequest = req.body

    //Validate the request body
    const validationResult = validateSignupRequest(req)
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.message })
    }

    //check if the user has an account
    const user = await User.findOne({ username })

    if (user) {
      return res.status(400).json({ error: 'Username already exists!' })
    }

    //hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    //create a default profile picture
    //https://avatar.iran.liara.run/public/boy?username=Scott
    const genderStr = gender.toLowerCase() === 'male' ? 'boy' : 'girl'
    const profilePicture = `https://avatar.iran.liara.run/public/${genderStr}?username=${username}`

    const newUser = new User({
      fullName,
      username,
      password: hashedPassword,
      gender,
      profilePicture,
    })

    if (newUser) {
      //generate JWT token
      const token = createToken({
        userId: newUser._id,
        username: newUser.username,
      })

      await newUser.save()

      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        profilePicture: newUser.profilePicture,
        gender: newUser.gender,
        createdAt: newUser.createdAt,
        token,
      })
    }

    return res.status(400).json({ error: 'Invalid user data' })
  } catch (error: unknown) {
    console.log(getErrorMessage(error, 'Error in Auth Controller - Signup API'))
    return res.status(500).json({ error: 'Internal Server Error!' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password }: IUserRequest = req.body

    const validateRequiredFieldsResponse = validateRequiredFields(req.body, [
      'username',
      'password',
    ])

    if (!validateRequiredFieldsResponse.valid) {
      return validateRequiredFieldsResponse
    }

    const user = await User.findOne({ username })

    const isCorrectPassword = await bcrypt.compare(
      password,
      user?.password || ''
    )

    if (!user || !isCorrectPassword) {
      return res.status(400).json({ error: 'Invalid credentials!' })
    }

    const token = createToken({ userId: user._id, username })

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePicture: user.profilePicture,
      gender: user.gender,
      createdAt: user.createdAt,
      token,
    })
  } catch (error: unknown) {
    console.log(getErrorMessage(error, 'Error in Auth Controller - Login API'))
    return res.status(500).json({ error: 'Internal Server Error!' })
  }
}
