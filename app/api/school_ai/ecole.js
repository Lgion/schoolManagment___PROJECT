


const handler = async (req,res,next) => {
    if(req.method == "GET"){

        res.json({done: "fichier écrit ;)"})
    }
}


export default handler


