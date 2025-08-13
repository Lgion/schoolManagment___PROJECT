const fs = require('fs')
const Reservation = require('../models/Reservation')




/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.createReservation = async (req, res) => {
  try {
    console.log('Controller - Request body:', req.body);
    
    const reservationObject = req.body.reservation;
    console.log('Controller - Reservation object:', reservationObject);
    
    const reservation = new Reservation({
      ...reservationObject
    });
    
    await reservation.save();
    console.log('Controller - Reservation saved successfully');
    
    return res.status(201).json({ message: 'Réservation enregistrée !' });
    
  } catch (error) {
    console.error('Controller - Error:', error);
    return res.status(400).json({ message: 'Erreur serveur', error: error.message });
  }
}

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.getAllReservation = (req, res, next) => {
  Reservation.find().then(
    (reservations) => {
      res.status(200).json(reservations)
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      })
    }
  )
}
exports.getOneReservation = (req, res, next) => {
  console.log('getOneReservation')
  Reservation.findOne({
    _id: req.params.id
  }).then(
    (reservation) => {
      console.log(reservation)
      res.status(200).json(reservation)
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      })
    }
  )
}

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.modifyReservation = (req, res, next) => {
  const reservationObject = req.file ? {
      ...JSON.parse(req.body.reservation),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body }

  delete reservationObject._userId
  Reservation.findOne({_id: req.params.id})
      .then((reservation) => {
          if (reservation.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'})
          } else {
              Reservation.updateOne({ _id: req.params.id}, { ...reservationObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }))
          }
      })
      .catch((error) => {
          res.status(400).json({ error })
      })
}

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.deleteReservation = (req, res, next) => {
  Reservation.findOne({ _id: req.params.id})
      .then(reservation => {
          if (reservation.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'})
          } else {
              const filename = reservation.imageUrl.split('/images/')[1]
              fs.unlink(`images/${filename}`, () => {
                  Reservation.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }))
              })
          }
      })
      .catch( error => {
          res.status(500).json({ error })
      })
}

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.likeReservation = (req, res, next) => {
  console.log('likeReservation')
  // console.log(req.body)
  // console.log(req.auth.userId)

  Reservation.findOne({
    _id: req.params.id
  }).then(
    (reservation) => {
      console.log(reservation)
      console.log(req.body)
      let {usersLiked,usersDisliked,likes,dislikes} = reservation
      , disliked = usersDisliked.includes(req.auth.userId)
      , liked = usersLiked.includes(req.auth.userId)
      , {like} = req.body
      if(like == 0) {
        reservation.likes = liked ? likes -1 : likes
        reservation.dislikes = disliked ? dislikes -1 : dislikes
        console.log("0")
        console.log(reservation.usersLiked.filter(v => v!=req.auth.userId))
        reservation.usersLiked = reservation.usersLiked.filter(v => v!=req.auth.userId)
        reservation.usersDisliked = reservation.usersDisliked.filter(v => v!=req.auth.userId)
      }
      if(like == 1){
        console.log("1")
        reservation.usersLiked.push(req.auth.userId)
        reservation.likes++
      }
      if(like == -1){
        console.log("-1")
        reservation.usersDisliked.push(req.auth.userId)
        reservation.dislikes++
      }

      // let a = {...({likes,dislikes,usersLiked,usersDisliked} = reservation._doc)}
      // console.log(a,reservation)
      console.log("req.auth.userId")
      console.log({ _id: req.auth.userId})
      console.log({ _id: req.params.id})
      console.log("req.params.id")

      Reservation.updateOne({ _id: req.params.id}, { ...({likes,dislikes,usersLiked,usersDisliked} = reservation._doc)})
      .then(() => res.status(201).json({message : 'Vote pris en compte!'}))
      .catch(error => res.status(401).json({ error }))

    }
  ).catch(
    (error) => {
      res.status(403).json({
        error: error
      })
    }
  )
}

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
exports.getAll = (req, res, next) => {
  /*SNIPPET REQUEST BODY*/
  // ner_body
  /*SNIPPET MONGOOSE CRUD*/
  // necmfind
  /*SNIPPET express res*/
  res.status(200).json(Data)
  
}

exports.updateMenu = (req, res, next) => {
  res.json({message: "le controlleur pour cette action ('update') n'a pas encore été codé"})
}
exports.deleteMenu = (req, res, next) => {
  res.status(201).json({message: "le controlleur pour cette action ('delete') n'a pas encore été codé"})
}
exports.addMenu = (req, res, next) => {
  console.log(req.body);

  //RÉCUPÉRER DES DONNÉES AVANT DE LES SUPPRIMER, SI NÉCESSAIRE 
  let nom_restau = Object.keys(req.body)[0]
  , lieu_restau = Object.keys(req.body)[1]
  delete req.body[lieu_restau]
  //TRAITER LES DONNÉES POUR POUVOIR LES INSÉRER AU BON ENDROIT DANS LE FICHIER MODEL Reservation.js
  Reservation.menus.carte = {...reservation.menus.carte, ...req.body}
  //LES ÉCRIRE DANS UN FICHIER
  let buffer = new Buffer.from("const Reservation = "+JSON.stringify(reservation));
  fs.open("models/Reservation.js", "w", function(err, fd) {
      if(err) {
          console.log('Cant open file');
      }else {
          fs.write(fd, buffer, 0, buffer.length, 
                  null, function(err,writtenbytes) {
              if(err) {
                  console.log('Cant write to file');
              }else {
                  console.log(writtenbytes +
                      ' characters added to file');
              }
          })
      }
  })
  //RENVOYER LA RÉPONSE
  res.status(200).json({message:"Données créées avec succès"})
}
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
