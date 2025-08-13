const express = require('express')
const router = express.Router()
// const auth = require('../middlewares/auth')
const multer = require('../middlewares/multer')
const reservationCtrl = require('../controllers/reservation')

router.get('/', reservationCtrl.getAllReservation)
router.post('/', multer, reservationCtrl.createReservation)
// router.get('/:id', auth, reservationCtrl.getOneReservation)
// router.put('/:id', auth, multer, reservationCtrl.modifyReservation)
// router.delete('/:id', auth, reservationCtrl.deleteReservation)
// router.post('/:id/like', auth, reservationCtrl.likeReservation)

module.exports = router