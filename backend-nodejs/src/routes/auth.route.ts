import express, { Router } from 'express'
import { login, signup, logout } from '../controllers/auth.controller'

const router: Router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)

export default router
