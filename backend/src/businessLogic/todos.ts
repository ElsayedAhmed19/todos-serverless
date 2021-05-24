import 'source-map-support/register'

import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { DataAccessLayer } from '../dataLayer/DataAccessLayer'
import { Storage } from '../dataLayer/Storage'
import { createLogger } from '../utils/logger'
const dataAccessLayer = new DataAccessLayer()
const storage = new Storage()

const logger = createLogger('todos')
export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Getting all todos for the user has Id ${userId}`)

  return await dataAccessLayer.getTodoItems(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  const todoId = uuid.v4()

  const newItem: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }

  logger.info(`Creating a todo ${todoId} for user ${userId}`, { todoItem: newItem })

  await dataAccessLayer.createTodoItem(newItem)

  return newItem
}

export async function updateTodo(userId: string, todoItemId: string, updateTodoRequest: UpdateTodoRequest) {
  logger.info(`Updating a todo ${todoItemId} for user ${userId}`, { todoUpdate: updateTodoRequest })

  const todoItem = await dataAccessLayer.getTodoItem(todoItemId)

  if (!todoItem)
    throw new Error('Todo not found')

  if (todoItem.userId !== userId) {
    logger.error(`User ${userId} is not allowed to update todo ${todoItemId}`)
    throw new Error('User is not allowed to update item')
  }

  dataAccessLayer.updateTodoItem(todoItemId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoItemId: string) {
  logger.info(`Deleting a todo ${todoItemId} for user ${userId}`, { userId, todoItemId })

  const todoItem = await dataAccessLayer.getTodoItem(todoItemId)

  if (!todoItem)
    throw new Error('Todo not found')

  if (todoItem.userId !== userId) {
    logger.error(`User ${userId} is not allowed to delete todo ${todoItemId}`)
    throw new Error('User is not allowed to delete item')
  }

  dataAccessLayer.deleteTodoItem(todoItemId)
}

export async function updateAttachmentUrl(userId: string, todoItemId: string, attachmentId: string) {
  logger.info(`Generating attachment URL for attachment ${attachmentId}`)

  const attachmentUrl = await storage.getAttachmentUrl(attachmentId)

  logger.info(`Updating todo ${todoItemId} with attachment URL ${attachmentUrl}`, { userId, todoItemId })

  const todoItem = await dataAccessLayer.getTodoItem(todoItemId)

  if (!todoItem)
    throw new Error('Todo not found')

  if (todoItem.userId !== userId) {
    logger.error(`User ${userId} is not allowed to update todo ${todoItemId}`)
    throw new Error('User is not allowed to update item')
  }

  await dataAccessLayer.updateAttachmentUrl(todoItemId, attachmentUrl)
}

export async function generateUploadUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating upload URL for attachment ${attachmentId}`)

  return await storage.getUploadUrl(attachmentId)
}