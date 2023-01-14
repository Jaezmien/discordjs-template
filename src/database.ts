import path from 'path'
import { Sequelize } from 'sequelize'
import { ROOT_PATH } from './globals'

export const Database = new Sequelize({
	dialect: 'sqlite',
	storage: path.join(ROOT_PATH, 'database', 'database.sqlite'),
})
