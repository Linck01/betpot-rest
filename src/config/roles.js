const allRoles = {
  user: ['createGame', 'createBet'],
  admin: ['manageUsers', 'manageGames'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
