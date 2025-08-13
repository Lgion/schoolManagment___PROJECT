const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/user')

router.post('/login', userCtrl.login)
router.post('/signup', userCtrl.signup)
router.post('/logout', userCtrl.logout)
router.post('/update/:id/:value', userCtrl.updateRole)


module.exports = router