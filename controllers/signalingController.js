module.exports.handleOffer = () =>{
    // logic to handle offer
    const {target, offer} =req.body
    // emit offer to target user(assuming you have access to io here)
    io.to(target).emit('offer', {target, offer});
    res.status(200).send({ message :'Offer sent'})
};
module.exports.handleAnswer =(req, res) =>{
    // logic to handle answer
    const {target, answer} = req.body;
    io.to(target).emit('answer', {target, answer});
    res.status(200).send({message:'Answer sent'})
};

module.exports.handleIceCandidate = (req, res) =>{
    // logic to handle ice candidate
    const {target, candidate} = req.body;
    io.to(target).emit('ice-candidate', {target, candidate});
    res.status(200).send({'message' : 'Ice candidate sent'});
}