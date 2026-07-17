const { Sequelize, DataTypes } = require('sequelize')

const {
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_ADDRESS = '',
} = process.env

const [host, port] = MYSQL_ADDRESS.split(':')

const sequelize = new Sequelize('collect_gong', MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
})

const Template = sequelize.define('Template', {
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
  await Template.sync({ alter: true })
  await Record.sync({ alter: true })
}

module.exports = {
  init,
  Template,
  Record,
}
