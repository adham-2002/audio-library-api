
const Audio = require("../models/audio.model");
const path = require("path");
const fs = require("fs").promises;


const getAllAudio=async(req,res,next)=>{
try{
   const audio = await Audio.find()
   res.json({ audio });

}catch(err){
    next(err)
}
}

module.exports = getAllAudio