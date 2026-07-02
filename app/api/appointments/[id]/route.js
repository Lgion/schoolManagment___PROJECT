import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const mongoose = require('mongoose')
const Appointment = require('../../_/models/ai/Appointment')
require('../../_/models/ai/Eleve')
require('../../_/models/ai/Teacher')

const FORMATS = ['PRESENTIAL', 'VISIO']

/**
 * PATCH /api/appointments/{id}
 * Fait évoluer le statut d'un rendez-vous. Body : { action, agreedDateIndex?, agreedFormat?, message? }
 *   - accept  : destinataire seulement, depuis PENDING. Choisit la date (index) et le
 *               format ; génère visioRoomName si VISIO. → ACCEPTED
 *   - reject  : destinataire seulement, depuis PENDING. → REJECTED
 *   - cancel  : initiateur ou destinataire, depuis PENDING/ACCEPTED. → CANCELED
 *   - complete: initiateur ou destinataire, depuis ACCEPTED. → COMPLETED
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'PATCH /api/appointments/[id]')
    if (!authResult.success) return authResult.response
    const me = authResult.userId

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const appointment = await Appointment.findById(id)
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Rendez-vous non trouvé' }, { status: 404 })
    }

    const isInitiator = appointment.initiatorId === me
    const isRecipient = appointment.recipientId === me
    if (!isInitiator && !isRecipient) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { action, agreedDateIndex, agreedFormat, message } = body || {}

    switch (action) {
      case 'accept': {
        if (!isRecipient) {
          return NextResponse.json({ success: false, error: 'Seul le destinataire peut accepter' }, { status: 403 })
        }
        if (appointment.meetingStatus !== 'PENDING') {
          return NextResponse.json({ success: false, error: 'Ce rendez-vous ne peut plus être accepté' }, { status: 409 })
        }
        // Choix de la date : index requis si plusieurs créneaux ; sinon le seul.
        const idx = appointment.proposedDates.length === 1 ? 0 : Number(agreedDateIndex)
        if (!Number.isInteger(idx) || idx < 0 || idx >= appointment.proposedDates.length) {
          return NextResponse.json({ success: false, error: 'Créneau choisi invalide' }, { status: 400 })
        }
        // Choix du format : requis si plusieurs options ; sinon la seule.
        const fmt = appointment.meetingFormatOptions.length === 1 ? appointment.meetingFormatOptions[0] : agreedFormat
        if (!FORMATS.includes(fmt) || !appointment.meetingFormatOptions.includes(fmt)) {
          return NextResponse.json({ success: false, error: 'Format choisi invalide' }, { status: 400 })
        }
        const chosen = appointment.proposedDates[idx]
        appointment.agreedDate = { startDate: chosen.startDate, endDate: chosen.endDate }
        appointment.agreedFormat = fmt
        appointment.visioRoomName = fmt === 'VISIO' ? `ecole-rdv-${appointment._id}` : ''
        appointment.meetingStatus = 'ACCEPTED'
        break
      }
      case 'reject': {
        if (!isRecipient) {
          return NextResponse.json({ success: false, error: 'Seul le destinataire peut refuser' }, { status: 403 })
        }
        if (appointment.meetingStatus !== 'PENDING') {
          return NextResponse.json({ success: false, error: 'Ce rendez-vous ne peut plus être refusé' }, { status: 409 })
        }
        appointment.meetingStatus = 'REJECTED'
        if (typeof message === 'string' && message.trim()) appointment.message = message.trim()
        break
      }
      case 'cancel': {
        if (!['PENDING', 'ACCEPTED'].includes(appointment.meetingStatus)) {
          return NextResponse.json({ success: false, error: 'Ce rendez-vous ne peut plus être annulé' }, { status: 409 })
        }
        appointment.meetingStatus = 'CANCELED'
        if (typeof message === 'string' && message.trim()) appointment.message = message.trim()
        break
      }
      case 'complete': {
        if (appointment.meetingStatus !== 'ACCEPTED') {
          return NextResponse.json({ success: false, error: 'Seul un rendez-vous confirmé peut être terminé' }, { status: 409 })
        }
        appointment.meetingStatus = 'COMPLETED'
        break
      }
      default:
        return NextResponse.json({ success: false, error: 'action invalide' }, { status: 400 })
    }

    appointment.updatedAt = new Date()
    await appointment.save()

    await appointment.populate([
      { path: 'studentId', select: 'nom prenoms' },
      { path: 'teacherRef', select: 'nom prenoms' },
    ])

    return NextResponse.json({ success: true, data: appointment })
  } catch (error) {
    console.error('❌ [API] PATCH /api/appointments/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour du rendez-vous' }, { status: 500 })
  }
}
