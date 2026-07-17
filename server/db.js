const { Sequelize, DataTypes } = require('sequelize')

const {
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_ADDRESS = '',
} = process.env

const [host, port] = MYSQL_ADDRESS.split(':')
const database = 'collect_gong'

const baseSequelize = new Sequelize('', MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
})

const sequelize = new Sequelize(database, MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
})

const User = sequelize.define('User', {
  openid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nickName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  avatarUrl: {
    type: DataTypes.STRING(1024),
    allowNull: false,
    defaultValue: '',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
})

const Template = sequelize.define('Template', {
  creatorOpenid: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  displayUpdatedAt: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
})

const Record = sequelize.define('Record', {
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  templateName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  submitterName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  submitterOpenid: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
  },
})

async function init() {
  await baseSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`)
  await baseSequelize.close()
  await sequelize.authenticate()
  await User.sync({ alter: true })
  await Template.sync({ alter: true })
  await Record.sync({ alter: true })
}

module.exports = {
  init,
  User,
  Template,
  Record,
}
