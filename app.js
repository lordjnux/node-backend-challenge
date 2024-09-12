const express = require("express");
const { Router } = require("express");

// * .ENV:
const PORT = 3000;

// * Model / Schema:
class ToDo {
  constructor(id, task, completed = false) {
    this.id = id;
    this.task = task;
    this.completed = completed;
  }
}

//* STORAGE:
const TODOS_STORAGE = [];

// * SERVICE:
const todoService = {
  findAll: async () => {
    try {
      return await TODOS_STORAGE;
    } catch (error) {
      throw new Error(`ERROR findAll: ${error.message}`);
    }
  },
  findById: async (id) => {
    try {
      return await TODOS_STORAGE.find((todo) => todo.id === id);
    } catch (error) {
      throw new Error(`ERROR findById: ${error.message}`);
    }
  },
  delete: async (id) => {
    try {
      const index = TODOS_STORAGE.findIndex((todo) => todo.id == id);

      if (index === -1) return undefined;

      const deletedTodoItem = TODOS_STORAGE.splice(index, 1);
      return deletedTodoItem[0];
    } catch (error) {
      throw new Error(`ERROR delete: ${error.message}`);
    }
  },
  create: async (todoItem) => {
    try {
      const newId =
        TODOS_STORAGE.length > 0
          ? Math.max(...TODOS_STORAGE.map((todo) => todo.id)) + 1
          : 1;

      const newTodoItem = new ToDo(newId, todoItem.task, todoItem.completed);

      await TODOS_STORAGE.push(newTodoItem);

      return newTodoItem;
    } catch (error) {
      throw new Error(`ERROR create: ${error.message}`);
    }
  },
  update: async (id, todoItem) => {
    try {
      const todoToUpdate = await todoService.findById(+id);
      if (!todoToUpdate) return undefined;

      todoToUpdate.task = todoItem.task ?? todoToUpdate.task;
      todoToUpdate.completed = todoItem.completed ?? todoToUpdate.completed;

      return todoToUpdate;
    } catch (error) {
      throw new Error(`ERROR update: ${error.message}`);
    }
  },
};

//* CONTROLLER:
const todoController = {
  get: async (request, response) => {
    try {
      const data = await todoService.findAll();
      response.status(200).send({ status: 200, data });
    } catch (error) {
      response.status(500).send({
        status: 500,
        message: error.message,
      });
    }
  },
  getOne: async (request, response) => {
    try {
      const { id } = request.params;
      const data = await todoService.findById(+id);

      if (!data) {
        response.status(404).send({
          staus: 404,
          data: [],
          message: `ToDo Item(#${id}) not found`,
        });
        return;
      }

      response.status(200).send({ status: 200, data });
    } catch (error) {
      response.status(500).send({
        status: 500,
        message: error.message,
      });
    }
  },
  post: async (request, response) => {
    try {
      const body = request.body;
      const data = await todoService.create(body);

      if (!data) {
        response
          .status(404)
          .send({ status: 404, message: `Todo was not created.` });
        return;
      }

      response.status(200).send({ status: 200, data });
    } catch (error) {
      response.status(500).send({
        status: 500,
        message: error.message,
      });
    }
  },
  put: async (request, response) => {
    try {
      const { id } = request.params;
      const updatedData = request.body;

      const data = await todoService.update(+id, updatedData);

      if (!data) {
        response
          .status(404)
          .send({ status: 404, message: `Todo was not updated.` });
        return;
      }

      response.status(200).send({
        status: 200,
        data,
        message: `Todo(#${id}) was updated successfully.`,
      });
    } catch (error) {
      response.status(500).send({
        status: 500,
        message: error.message,
      });
    }
  },
  delete: async (request, response) => {
    try {
      const { id } = request.params;
      const data = await todoService.delete(+id);

      if (!data) {
        response
          .status(404)
          .send({ status: 404, message: `Todo(#${id}) not found.` });
        return;
      }

      response.status(200).send({
        status: 200,
        data,
        message: `Todo(#${id}) was deleted successfully.`,
      });
    } catch (error) {
      response.status(500).send({
        status: 500,
        message: error.message,
      });
    }
  },
};

// * MIDDLEWARES:
const validateIdparam = (request, response, next) => {
  const { id } = request.params;

  if (!/^\d+$/.test(id)) {
    response.status(400).send({
      status: 400,
      message: `Invalid id param: ${id}. Id must be a number.`,
    });
    return;
  }

  next();
};

const validateBodyTodo = (request, response, next) => {
  const body = request.body;

  if (
    typeof body !== "object" ||
    typeof body.task !== "string" ||
    typeof body.completed !== "boolean"
  ) {
    response.status(400).send({
      status: 400,
      message:
        "Invalid ToDo object. Expected format: { task: string, completed: boolean }",
    });
    return;
  }

  next();
};

//* TODO ROUTER:
const todoRouter = Router();

todoRouter.get("/", todoController.get);
todoRouter.post("/", validateBodyTodo, todoController.post);
todoRouter.get("/:id", validateIdparam, todoController.getOne);
todoRouter.delete("/:id", validateIdparam, todoController.delete);
todoRouter.put("/:id", validateIdparam, validateBodyTodo, todoController.put);

//* APP ROUTER:
const appRouter = Router();
appRouter.use("/todos", todoRouter);

const app = express();
app.use(express.json());

app.use(appRouter);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
