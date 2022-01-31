const { Member, Bet, Tip } = require('../models');
const mongoose = require('mongoose');

const payoutBet = async (bet,tips) => {
  const session = await mongoose.startSession();

  try {
      session.startTransaction();                    
      console.log(bet,tips);
      const bulkWriteMemberRequest = [],bulkWriteTipRequest = [];

      for (let tip of tips) {
        bulkWriteMemberRequest.push({updateOne:{filter: {gameId: bet.gameId,userId: tip.userId}, update: {$inc: {currency: tip.inc}}}});
        bulkWriteTipRequest.push({updateOne: {filter: {_id: tip._id}, update: {diff: tip.diff}}});
      }

      console.log(bulkWriteTipRequest);
      await Tip.bulkWrite(bulkWriteTipRequest);
      await Member.bulkWrite(bulkWriteMemberRequest);
      //await Bet.updateOne({_id: bet.id},{isPaid: true});

      await session.commitTransaction();
      
      console.log('Successfully paid out bet ' + bet.id + '.');
  } catch (e) {
      console.log(e);
      await session.abortTransaction();
  }
  session.endSession();

  return;
};

module.exports = {
  payoutBet
};
