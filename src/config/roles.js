const allRoles = {
  user: ['createGame'],
  admin: ['getUsers', 'manageUsers', 'manageGames'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
