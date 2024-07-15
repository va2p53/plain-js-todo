/**
 * Task .
 * @typedef {Object} Task
 * @property {boolean} status - indicates if task is done
 * @property {string} title - title of task
 * @property {string} id - unique id
 */

/**
 * A list of tasks.
 * @typedef {Object} TaskList
 * @property {string} title - title of a task list
 * @property {Task[]} tasks - array of tasks
 * @property {string} id - unique id
 */

/**
 * State saved into local storage
 * @typedef {Object} SavedState
 * @property {number} currentTaskListIndex = index of last selected task list
 * @property {TaskList[]} taskListCatalog - last task list
 */

/**
 * @typedef {Object} DragDataTransferPayload
 * @property {string} id id of an element dropped
 * @property {string} type data-type of element dropped
 */

/**
 * @type {TaskList[]}
 */
let taskListCatalog = [];

/**
 * @type {number}
 */
let currentTaskListIndex = -1;

const APP_ID = "TASKS_MANANGER_V1_B0828025";

//constant selectors
/**@type {HTMLDivElement} */
const taskListMenuElem = document.querySelector(".task-list-menu");
/**@type {HTMLButtonElement} */
const addTaskListButtonElem = taskListMenuElem.querySelector(
  ".add-task-list-button"
);
/**@type {HTMLInputElement} */
const addTaskListInputElem = taskListMenuElem.querySelector(
  ".add-task-list-input"
);
/**@type {HTMLUListElement} */
const taskListCatalogElem =
  taskListMenuElem.querySelector(".task-list-catalog");

/**@type {HTMLDivElement} */
const taskListContentElem = document.querySelector(".task-list-content");
/**@type {HTMLUListElement} */
const taskListElem = taskListContentElem.querySelector(".task-list-tasks");
/**@type {HTMLHeadingElement} */
const taskListTitleElem = taskListContentElem.querySelector(":scope > .title");
/**@type {HTMLHeadingElement} */
const taskListStatusElem = taskListContentElem.querySelector(".status");
/**@type {HTMLButtonElement} */
const addTaskButtonElem = taskListContentElem.querySelector(".add-task-button");
/**@type {HTMLInputElement} */
const addTaskInputElem = taskListContentElem.querySelector(".add-task-input");

//constant events

addTaskListButtonElem.addEventListener("click", onClickNewTaskListButton);
addTaskListInputElem.addEventListener("keydown", onConfirmTaskListNameInput);

addTaskButtonElem.addEventListener("click", onClickNewTaskButton);
addTaskInputElem.addEventListener("keydown", onConfirmTaskNameInput);

taskListTitleElem.addEventListener("click", onTaskListTitleClick);

// load state from store

initializeContent();

/**
 * Wrapper for existing functions to load saved state from store and initialize layout state from it.
 */
function initializeContent() {
  loadTasksFromLocalStore();
  updateTaskList();
  updateTaskListContentElement();
  selectTaskListElement(getTaskList(currentTaskListIndex)?.id);
}

/**
 * Handles creation of new task list
 */
function onClickNewTaskListButton() {
  createTaskList();
}

/**
 * Handles creation of new task list if enter was pressed in title input
 * @param {Event} event keypress event
 */
function onConfirmTaskListNameInput(event) {
  if (event.key === "Enter") {
    createTaskList();
  }
}

/**
 * Creates new task list, updates local state and layout
 */
function createTaskList() {
  if (!addTaskListInputElem.value) {
    console.log("TaskList group title is empty.");
    return;
  }

  /** @type {TaskList} */
  const newTaskList = {
    title: addTaskListInputElem.value,
    id: generateUid(),
    tasks: [],
  };
  preserveCurrentTaskListIndex(() => taskListCatalog.unshift(newTaskList));

  const taskListElement = createTaskListElement(
    newTaskList.title,
    newTaskList.id
  );
  taskListCatalogElem.prepend(taskListElement);
  addTaskListInputElem.value = "";

  saveStateToLocalStore();
}

/**
 * Switches to clicked task list
 * @param {Event} event click event
 */
function onClickTaskList(event) {
  if (event.target.classList.contains("remove-task-list-button")) {
    return;
  }

  /**@type {HTMLDivElement} */
  const element = event.currentTarget;

  const id = element.getAttribute("data-id");

  if (id) {
    const taskListIndex = taskListCatalog.findIndex((item) => item.id === id);

    if (taskListIndex === -1) {
      return;
    }

    currentTaskListIndex = taskListIndex;

    selectTaskListElement(id);

    updateTaskListContentElement();
    saveStateToLocalStore();
  }
}

/**
 * Handles creation of new task if enter was pressed in target
 * @param {Event} event keypress event
 */
function onConfirmTaskNameInput(event) {
  if (event.key === "Enter") {
    createTask();
  }
}

/**
 * Handles creation of new task
 */
function onClickNewTaskButton() {
  createTask();
}

/**
 * Creates new task, updates layout and local state
 */
function createTask() {
  if (!addTaskInputElem.value) {
    console.log("TaskList title is empty.");
    return;
  }

  if (!getTaskList(currentTaskListIndex)) {
    console.log("Nowhere to add task, task list is not selected.");
    return;
  }

  /** @type {Task} */
  const newTask = {
    title: addTaskInputElem.value,
    id: generateUid(),
    status: false,
  };

  getTaskList(currentTaskListIndex)?.tasks?.unshift(newTask);

  const taskElement = createTaskElement(newTask.title, newTask.id);

  taskListElem.prepend(taskElement);

  addTaskInputElem.value = "";
  updateTaskListStatusElem(getTaskList(currentTaskListIndex));
  saveStateToLocalStore();
}

/**
 * Handles removing of task list
 * @param {Event} event button click
 */
function onRemoveTaskList(event) {
  /**@type {HTMLDivElement} */
  const taskListElement = event.currentTarget.parentElement;
  if (taskListElement && taskListElement?.classList.contains("task-list")) {
    const id = taskListElement.getAttribute("data-id");
    const taskListIndex = taskListCatalog.findIndex((item) => item.id === id);

    if (taskListIndex === currentTaskListIndex && currentTaskListIndex !== -1) {
      taskListCatalog.splice(taskListIndex, 1);
      currentTaskListIndex = -1;
    } else if (taskListIndex !== -1) {
      preserveCurrentTaskListIndex(() =>
        taskListCatalog.splice(taskListIndex, 1)
      );
    }

    taskListElement.remove();
    updateTaskListContentElement();
    saveStateToLocalStore();
  }
}

/**
 * Handles removing of task from task list
 * @param {Event} event button click
 */
function onRemoveTask(event) {
  /**@type {HTMLDivElement} */
  const taskElement = event.currentTarget.parentElement;
  if (
    taskElement &&
    taskElement?.classList.contains("task") &&
    getTaskList(currentTaskListIndex)
  ) {
    const id = taskElement.getAttribute("data-id");

    const taskIndex = getTaskList(currentTaskListIndex).tasks.findIndex(
      (item) => item.id === id
    );

    if (taskIndex !== -1) {
      getTaskList(currentTaskListIndex).tasks.splice(taskIndex, 1);
    }

    taskElement.remove();
    updateTaskListStatusElem(getTaskList(currentTaskListIndex));
    saveStateToLocalStore();
  }
}

/**
 * Handles task list title click. Creates new input on top of it
 * @param {Event} event
 */
function onTaskListTitleClick(event) {
  if (!getTaskList(currentTaskListIndex)) {
    console.log("No task list selected, can't change it's title.");
    return;
  }

  if (event.target !== event.currentTarget) {
    return;
  }

  const newInput = createTextInputElement(["covering-input"]);
  newInput.addEventListener("focusout", onCancelTitleChange);
  newInput.addEventListener("keydown", onConfirmTaskListTitleChange);

  taskListTitleElem.appendChild(newInput);
  newInput.focus();
}

/**
 * Applies title change to task list if enter pressed
 * @param {Event} event
 */
function onConfirmTaskListTitleChange(event) {
  if (event.key === "Enter") {
    if (!event.currentTarget.value) {
      console.log("Input is empty, can't change title.");
    }

    changeListElementTitle(
      event.currentTarget.value,
      getTaskList(currentTaskListIndex).id,
      taskListCatalogElem,
      taskListCatalog
    );

    taskListTitleElem.textContent = event.currentTarget.value;

    saveStateToLocalStore();
    event.currentTarget.remove();
  }
}

/**
 * Applies title change to task if enter pressed
 * @param {Event} event
 */
function onConfirmTaskTitleChange(event) {
  if (event.key === "Enter") {
    if (!event.currentTarget.value) {
      console.log("Input is empty, can't change title.");
    }
    const id = event.currentTarget.parentElement.getAttribute("data-id");

    changeListElementTitle(
      event.currentTarget.value,
      id,
      taskListElem,
      getTaskList(currentTaskListIndex).tasks
    );

    saveStateToLocalStore();
    event.currentTarget.remove();
  }
}

/**
 * Handles task edit event
 * @param {Event} event
 */
function onEditTaskClick(event) {
  if (!getTaskList(currentTaskListIndex)) {
    console.log("No task list selected, can't change it's title.");
    return;
  }

  if (event.target !== event.currentTarget) {
    return;
  }

  const newInput = createTextInputElement(["covering-input"]);
  newInput.addEventListener("focusout", onCancelTitleChange);
  newInput.addEventListener("keydown", onConfirmTaskTitleChange);

  event.currentTarget.parentElement.appendChild(newInput);
  newInput.focus();
}

/**
 *  Changes title of an element in layout and it's list.
 * @param {string} newTitle
 * @param {string} id
 * @param {Element} elementParent
 * @param {(TaskList[]|Task[])} elementList
 */
function changeListElementTitle(newTitle, id, elementParent, elementList) {
  const index = elementList.findIndex((item) => item.id === id);

  if (index !== -1) {
    elementList[index].title = newTitle;
  }

  for (const child of elementParent.children) {
    if (child.getAttribute("data-id") === id) {
      const childTitle = child.querySelector(".title");
      if (childTitle) {
        childTitle.textContent = newTitle;
      }
    }
  }
}

/**
 * Cancels title change and removes input
 * @param {Event} event
 */
function onCancelTitleChange(event) {
  event.currentTarget.remove();
}

/**
 * Handles change of task status
 * @param {Event} event checkbox change
 */
function onChangeTaskStatus(event) {
  const newStatus = event.currentTarget.checked;

  const taskId = event.currentTarget.parentElement.getAttribute("data-id");

  const taskIndex = getTaskList(currentTaskListIndex)?.tasks?.findIndex(
    (item) => item.id === taskId
  );

  if (taskIndex !== undefined && taskIndex !== -1) {
    getTaskList(currentTaskListIndex).tasks[taskIndex].status = newStatus;

    updateTaskListStatusElem(getTaskList(currentTaskListIndex));
    saveStateToLocalStore();
  }
}

/**
 * Moves element with elementId to position under targetElement in layout and in it's saved list.
 * @param {Element} elementParent
 * @param {Element} targetElement
 * @param {string} movedElementId
 * @param {(TaskList[]|Task[])} elementList
 */
function moveItem(elementParent, targetElement, movedElementId, elementList) {
  if (!elementList) {
    console.log("Missing list of elements");
  }

  const id = targetElement.getAttribute("data-id");

  const indexOfInserted = elementList.findIndex(
    (item) => item.id === movedElementId
  );

  const indexOfTarget = elementList.findIndex((item) => item.id === id);

  if (indexOfInserted === indexOfTarget + 1) {
    console.log("Elements are on required positions");
    return;
  }

  const insertedElement = elementParent.querySelector(
    `:scope > [data-id="${movedElementId}"]`
  );

  targetElement.after(insertedElement);

  // Offset is to account for that we are supposed to insert element after target element, i.e. shimmy into new place
  // not just swap with another element. Without it after layout loaded from saved state (on reload) it will look like
  // element was inserted before target element when target index lower than index of moved element
  const offset = indexOfInserted > indexOfTarget ? 1 : 0;

  arrayMoveElement(elementList, indexOfInserted, indexOfTarget + offset);
}

// Drag'n'drop

/**
 * Handles dragend event
 * @param {DragEvent} event
 */
function onDragEnd(event) {
  event.currentTarget.classList.remove("dragged");
}

/**
 * Handles drop event. Invokes functions to move element to new place in
 * appropriate list. Received payload has ID of moved element and it's "type" to check
 * in which lists it is allowed.
 * @param {DragEvent} event
 */
function onDrop(event) {
  /** @type {HTMLDivElement} */
  const targetElement = event.currentTarget;
  targetElement.classList.remove("drag-over");

  const targetType = targetElement.getAttribute("data-type");
  const targetId = targetElement.getAttribute("data-id");

  const payloadString = event.dataTransfer.getData("text/plain");
  /** @type {DragDataTransferPayload} */
  const payload = JSON.parse(payloadString);

  if (!payload) {
    return;
  }

  if (targetId === payload.id) {
    console.log("Can't insert under itself.");
    return;
  }

  const validTypes = ["task-list", "task"];

  if (!validTypes.includes(targetType) || !validTypes.includes(payload.type)) {
    console.log("Drag'n'drop with wrong element.");
    return;
  }

  if (targetType !== payload.type) {
    console.log("Can't insert in different list.");
    return;
  }

  switch (targetType) {
    case "task-list":
      preserveCurrentTaskListIndex(() =>
        moveItem(
          taskListCatalogElem,
          targetElement,
          payload.id,
          taskListCatalog
        )
      );

      break;
    case "task":
      moveItem(
        taskListElem,
        targetElement,
        payload.id,
        getTaskList(currentTaskListIndex).tasks
      );
      break;
    default:
      break;
  }

  saveStateToLocalStore();
}

/**
 * Handles dragleave event
 * @param {DragEvent} event
 */
function onDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

/**
 * Handles dragover event
 * @param {DragEvent} event
 */
function onDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

/**
 * Handles dragenter event
 * @param {DragEvent} event
 */
function onDragEnter(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

/**
 *  Handles dragstart event. Sets payload with id and classlist.
 * @param {DragEvent} event
 */
function onDragStart(event) {
  const id = event.target.getAttribute("data-id");
  const type = event.target.getAttribute("data-type");

  /** @type {DragDataTransferPayload} */
  const load = { id, type };

  event.dataTransfer.setData("text/plain", JSON.stringify(load));

  setTimeout(() => {
    event.target.classList.add("dragged");
  }, 0);
}

// Persistence

/**
 * Saves Tasks to localStore
 */
function saveStateToLocalStore() {
  /** @type {SavedState} */
  const newState = {
    taskListCatalog,
    currentTaskListIndex,
  };
  const newStateString = JSON.stringify(newState);
  localStorage.setItem(APP_ID, newStateString);
}

/**
 * loads Tasks from local store
 */
function loadTasksFromLocalStore() {
  const lastStateString = localStorage.getItem(APP_ID);

  if (lastStateString) {
    /** @type {SavedState} */
    let lastState = null;

    try {
      lastState = JSON.parse(lastStateString);
    } catch (err) {
      console.error(err);
      return;
    }

    if (lastState?.taskListCatalog) {
      taskListCatalog = lastState?.taskListCatalog;
    }

    if (lastState?.currentTaskListIndex !== undefined) {
      currentTaskListIndex = lastState.currentTaskListIndex;
    }
  }
}

// Element creators

/**
 * Creates new task dom element and returns it.
 * @param {string} title task title
 * @param {string} id task uid
 * @returns new TaskList element
 */
function createTaskListElement(title, id) {
  const elem = document.createElement("div");
  elem.classList.add("task-list");
  elem.setAttribute("data-id", id);
  elem.setAttribute("data-type", "task-list");
  elem.setAttribute("draggable", true);
  elem.setAttribute("data-tooltip", title);
  elem.addEventListener("click", onClickTaskList);
  elem.addEventListener("dragend", onDragEnd);
  elem.addEventListener("drop", onDrop);
  elem.addEventListener("dragover", onDragOver);
  elem.addEventListener("dragenter", onDragEnter);
  elem.addEventListener("dragleave", onDragLeave);
  elem.addEventListener("dragstart", onDragStart);

  const titleElem = document.createElement("div");
  titleElem.classList.add("title");
  titleElem.textContent = title;

  const buttonElem = document.createElement("button");
  buttonElem.classList.add("remove-task-list-button");
  buttonElem.textContent = "X";
  buttonElem.addEventListener("click", onRemoveTaskList);

  const children = [titleElem, buttonElem];

  elem.append(...children);

  return elem;
}

/**
 * Creates new task dom element and returns it
 * @param {string} title task title
 * @param {string} id task uid
 * @param {boolean} [status=false] task initial status
 * @returns new Task element
 */
function createTaskElement(title, id, status = false) {
  const elem = document.createElement("div");
  elem.classList.add("task");
  elem.setAttribute("data-id", id);
  elem.setAttribute("data-type", "task");
  elem.setAttribute("draggable", true);
  elem.setAttribute("data-tooltip", title);
  elem.addEventListener("dragend", onDragEnd);
  elem.addEventListener("drop", onDrop);
  elem.addEventListener("dragover", onDragOver);
  elem.addEventListener("dragenter", onDragEnter);
  elem.addEventListener("dragleave", onDragLeave);
  elem.addEventListener("dragstart", onDragStart);

  const checkBoxElem = document.createElement("input");
  checkBoxElem.setAttribute("type", "checkbox");
  checkBoxElem.classList.add("task-checkbox");
  checkBoxElem.checked = status;
  checkBoxElem.addEventListener("change", onChangeTaskStatus);

  const titleElem = document.createElement("div");
  titleElem.classList.add("title");
  titleElem.textContent = title;

  const editButtonElem = document.createElement("button");
  editButtonElem.classList.add("edit-task-button");
  editButtonElem.addEventListener("click", onEditTaskClick);
  editButtonElem.textContent = "E";

  const buttonElem = document.createElement("button");
  buttonElem.classList.add("remove-task-button");
  buttonElem.addEventListener("click", onRemoveTask);
  buttonElem.textContent = "X";

  const children = [checkBoxElem, titleElem, editButtonElem, buttonElem];

  elem.append(...children);

  return elem;
}

/**
 * Creates new text input element with set classes
 * @param {string[]} [classList = []] array of classes
 * @returns new text input element
 */
function createTextInputElement(classList = []) {
  const elem = document.createElement("input");
  elem.setAttribute("type", "text");
  elem.classList.add(classList);

  return elem;
}

// utils

/**
 * Generates uid. Security and lack of collisions is NOT guaranteed.
 */
function generateUid() {
  return "id" + new Date().getTime() + Math.random().toString(16);
}

/**
 * Generates statistics of given task list
 * @param {TaskList} taskList
 * @returns statistics of task
 */
function getTaskListStatistic(taskList) {
  let statistic = { done: 0, total: 0 };

  statistic.total = taskList.tasks.length;

  taskList.tasks.forEach((item) => {
    if (item.status === true) {
      statistic.done += 1;
    }
  });

  return statistic;
}

/**
 * Moves element in array from one index to another.
 * Mutates array. Does nothing if any of indexes outside of
 * array's bounds or equal to each other.
 * @param {*[]} array
 * @param {number} sourceIndex
 * @param {number} targetIndex
 */
function arrayMoveElement(array, sourceIndex, targetIndex) {
  if (sourceIndex === targetIndex) {
    return;
  }

  if (sourceIndex >= array.length || sourceIndex < 0) {
    return;
  }

  if (targetIndex >= array.length || targetIndex < 0) {
    return;
  }

  array.splice(targetIndex, 0, array.splice(sourceIndex, 1)[0]);
}

/**
 * Updates layout of current task list, using current task index
 * Makes task list content invisible if there is no current task list
 */
function updateTaskListContentElement() {
  if (currentTaskListIndex !== -1 && getTaskList(currentTaskListIndex)) {
    taskListContentElem.classList.remove("hidden");

    taskListTitleElem.textContent = getTaskList(currentTaskListIndex).title;

    const taskList = getTaskList(currentTaskListIndex);

    updateTaskListStatusElem(taskList);

    let newTasks = [];

    taskList.tasks.forEach((item) => {
      const task = createTaskElement(item.title, item.id, item.status);
      newTasks.push(task);
    });

    taskListElem.replaceChildren(...newTasks);
  } else {
    taskListTitleElem.textContent = "Выберите список";
    taskListStatusElem.textContent = "Не доступно";
    taskListElem.replaceChildren();

    taskListContentElem.classList.add("hidden");
  }
}

/**
 * Updates layout of task list catalog according to current task list data.
 */
function updateTaskList() {
  /**@type {HTMLDivElement[]} */
  const newTaskLists = [];

  taskListCatalog.forEach((item) => {
    const newTaskList = createTaskListElement(item.title, item.id);
    newTaskLists.push(newTaskList);
  });

  taskListCatalogElem.replaceChildren(...newTaskLists);
}

/**
 * Updates task list status element with data from task
 * @param {TaskList} task task to update status
 */
function updateTaskListStatusElem(task) {
  const statistic = getTaskListStatistic(task);
  taskListStatusElem.textContent = `Всего: ${statistic.total}. Готово: ${statistic.done}.`;
}

/**
 * Visually selects task element in task list catalog
 * @param {string} id
 */
function selectTaskListElement(id) {
  if (!id) {
    return;
  }

  for (const child of taskListCatalogElem.children) {
    if (child.getAttribute("data-id") === id) {
      child.classList.add("selected");
    } else {
      child.classList.remove("selected");
    }
  }
}

/**
 * Returns reference to task from taskListCatalog
 * @param {number} i taskIndex
 * @returns
 */
function getTaskList(i) {
  return taskListCatalog[i] ?? null;
}

/**
 * Memoizes current task list id, invokes callback,
 * find new currentTaskListIndex. Returns callback result.
 * It is intended to be used with functions that can make currentTaskIndex invalid
 * @param {Function} callback
 */
function preserveCurrentTaskListIndex(callback) {
  const currentTaskListId = getTaskList(currentTaskListIndex)?.id;
  const res = callback();
  currentTaskListIndex = taskListCatalog.findIndex(
    (item) => item.id === currentTaskListId
  );
  return res;
}
