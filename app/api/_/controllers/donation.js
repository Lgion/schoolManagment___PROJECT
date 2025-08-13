const fs = require('fs')
const Donation = require('../models/Donation')




/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.createDonation = (req, res, next) => {
  console.log(req.body)
  console.log(typeof req.body)
  console.log(typeof req.body.donation)
  console.log('oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
  const donationObject = req.body.donation
  console.log('2oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
  // const donationObject = JSON.parse(req.body.donation)
  const donation = new Donation({
      ...donationObject
      // , userId: req.auth.userId
      // , imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  })
  console.log('3oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
  donation.save()
  
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
  console.log('4oijiojiojoioijfdsoijfdoijfoijfdsoijfdsijfds')
}

/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */
/************************************************************************************************************ */

exports.getAllDonation = (req, res, next) => {
  Donation.find().then(
    (donations) => {
      res.status(200).json(donations)
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      })
    }
  )
}
exports.getOneDonation = (req, res, next) => {
  console.log('getOneDonation')
  Donation.findOne({
    _id: req.params.id
  }).then(
    (donation) => {
      console.log(donation)
      res.status(200).json(donation)
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

exports.modifyDonation = (req, res, next) => {
  const donationObject = req.file ? {
      ...JSON.parse(req.body.donation),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body }

  delete donationObject._userId
  Donation.findOne({_id: req.params.id})
      .then((donation) => {
          if (donation.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'})
          } else {
              Donation.updateOne({ _id: req.params.id}, { ...donationObject, _id: req.params.id})
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

exports.deleteDonation = (req, res, next) => {
  Donation.findOne({ _id: req.params.id})
      .then(donation => {
          if (donation.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'})
          } else {
              const filename = donation.imageUrl.split('/images/')[1]
              fs.unlink(`images/${filename}`, () => {
                  Donation.deleteOne({_id: req.params.id})
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

exports.likeDonation = (req, res, next) => {
  console.log('likeDonation')
  // console.log(req.body)
  // console.log(req.auth.userId)

  Donation.findOne({
    _id: req.params.id
  }).then(
    (donation) => {
      console.log(donation)
      console.log(req.body)
      let {usersLiked,usersDisliked,likes,dislikes} = donation
      , disliked = usersDisliked.includes(req.auth.userId)
      , liked = usersLiked.includes(req.auth.userId)
      , {like} = req.body
      if(like == 0) {
        donation.likes = liked ? likes -1 : likes
        donation.dislikes = disliked ? dislikes -1 : dislikes
        console.log("0")
        console.log(donation.usersLiked.filter(v => v!=req.auth.userId))
        donation.usersLiked = donation.usersLiked.filter(v => v!=req.auth.userId)
        donation.usersDisliked = donation.usersDisliked.filter(v => v!=req.auth.userId)
      }
      if(like == 1){
        console.log("1")
        donation.usersLiked.push(req.auth.userId)
        donation.likes++
      }
      if(like == -1){
        console.log("-1")
        donation.usersDisliked.push(req.auth.userId)
        donation.dislikes++
      }

      // let a = {...({likes,dislikes,usersLiked,usersDisliked} = donation._doc)}
      // console.log(a,donation)
      console.log("req.auth.userId")
      console.log({ _id: req.auth.userId})
      console.log({ _id: req.params.id})
      console.log("req.params.id")

      Donation.updateOne({ _id: req.params.id}, { ...({likes,dislikes,usersLiked,usersDisliked} = donation._doc)})
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
  //TRAITER LES DONNÉES POUR POUVOIR LES INSÉRER AU BON ENDROIT DANS LE FICHIER MODEL Donation.js
  Donation.menus.carte = {...donation.menus.carte, ...req.body}
  //LES ÉCRIRE DANS UN FICHIER
  let buffer = new Buffer.from("const Donation = "+JSON.stringify(donation));
  fs.open("models/Donation.js", "w", function(err, fd) {
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
