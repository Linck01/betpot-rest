const GameLog = require('../models/gameLog.model.js');
const gameService = require('./game.service.js');
const betService = require('./bet.service.js');
const memberService = require('./member.service.js');
const tipService = require('./tip.service.js');
const userService = require('./user.service.js');

const createGameLogs = async (logBody) => {
  const gameLog = await GameLog.create(logBody);
  return gameLog;
};

const queryGameLogs = async (filter, options) => {
  const gameLogs = await GameLog.paginate(filter, options);
  return gameLogs;
};

const deleteGameLogByGameId = async (gameId) => {
  await GameLog.deleteMany({gameId});
  return;
};

const rebuildGameLogs = async (game) => {
  await deleteGameLogByGameId(game.id);
  const logs = [];

  logs.push(assembleLogBody('gameCreated', game.id, 'Game created', 'Game "' + game.title + '" was created.', game._createdAt));

  const bets = await betService.getBetsByGameId(game.id,{projection: {title: 1, _createdAt: 1, isSolved: 1, solvedAt: 1, isAborted: 1}});

  // Bet created & solved
  for (const bet of bets) {
    const betTitle = bet.title.length > 50 ? bet.title.substr(0,48) + '..' : bet.title;
    logs.push(assembleLogBody('betCreated', game.id, 'Bet created', 'Bet "' + betTitle +'" was created', new Date(bet._createdAt)));
    
    if (bet.isSolved)
      logs.push(assembleLogBody('betSolved', game.id, 'Bet solved', 'Bet "' + betTitle +'" was solved', new Date(bet.solvedAt)));
    if (bet.isAborted)
      logs.push(assembleLogBody('betAborted', game.id, 'Bet aborted', 'Bet "' + betTitle +'" was aborted', new Date(bet.solvedAt)));
  }

  // Highest winner tips
  const highestWinTips = await tipService.queryTips({gameId: game.id, isWinner: true},{sortBy: '-diff', limit: 3, page: 1});
  let i = 1;
  for (const tip of highestWinTips.results) {
    const user = await userService.getUserById(tip.userId);
    const bet = await betService.getBetById(tip.betId);
    logs.push(assembleLogBody('winRecord', game.id, 'Win record #' + i, 'Tip from user "' + user.username +'" ´is #' + i + ' highest winner among all bets (+' + tip.diff + ')', new Date((new Date(bet.solvedAt)).getTime() + (1000 * 1))));
    i++;
  }

  // MemberCounts milestones
  const members = (await memberService.getMembers({gameId: game.id}, {projection: {_createdAt: 1}, sort: { _createdAt: 1}}));
  let memberCount = 0; const milestones = [1,2,3];//const milestones = [5,10,25,50,100,200,500,1000];
  for (const member of members) {
    memberCount++;
    if (milestones.includes(memberCount))
      logs.push(assembleLogBody('memberMilestone', game.id, 'Member milestone', 'Game reached "' + memberCount +'" members', new Date(member._createdAt)));
  }

  logs.sort((a,b) => a._createdAt < b._createdAt);
  await createGameLogs(logs);
  return true;
};

const assembleLogBody = (logType, gameId, title, desc, _createdAt) => {
  return {logType, gameId, title, desc, _createdAt};
};

module.exports = {
  createGameLogs,
  queryGameLogs,
  deleteGameLogByGameId,
  rebuildGameLogs
};

// 