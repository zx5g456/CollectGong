const { Sequelize, DataTypes } = require('sequelize')

const {
  MYSQL_USERNAME,
  MYSQL_PASSWORD,
  MYSQL_ADDRESS = '',
} = process.env

const [host, port] = MYSQL_ADDRESS.split(':')
const database = 'collect_gong'

const pool = {
  max: 5,
  min: 0,
  acquire: 10000,
  idle: 10000,
  evict: 1000,
}

const baseSequelize = new Sequelize('', MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: false,
  pool,
  dialectOptions: {
    connectTimeout: 10000,
  },
})

const sequelize = new Sequelize(database, MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: false,
  pool,
  dialectOptions: {
    connectTimeout: 10000,
  },
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

const TRANSIENT_CONNECTION_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
])

const isTransientConnectionError = (error) => {
  const candidates = [error, error && error.parent, error && error.original]
  return candidates.some((candidate) => (
    candidate && (
      TRANSIENT_CONNECTION_ERROR_CODES.has(candidate.code)
      || TRANSIENT_CONNECTION_ERROR_CODES.has(candidate.errno)
    )
  ))
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

// Only use this for reads: retrying writes after a dropped connection can duplicate data.
async function retryDatabaseRead(operation, maxRetries = 2) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (!isTransientConnectionError(error) || attempt >= maxRetries) {
        throw error
      }

      console.warn(`Database connection was reset; retrying read (${attempt + 1}/${maxRetries})`)
      await wait(100 * (attempt + 1))
    }
  }
}

module.exports = {
  init,
  sequelize,
  User,
  Template,
  Record,
  retryDatabaseRead,
}
