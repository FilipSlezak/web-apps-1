// Signals list to handle dingling event listeners from click to edit functionality
let signals = {};

const loadStore = () => {
  return JSON.parse(localStorage.getItem("tasks"));
};

const saveStore = (data) => {
  const stringified = JSON.stringify(data);
  localStorage.setItem("tasks", stringified);
};

const removeItem = (taskId) => {
  const tasks = loadStore() || [];
  saveStore(tasks.filter((t) => t.id !== taskId));
  refreshList();
};

const hideRemoveButton = (button) => {
  button.className = "remove hidden";
};

const showRemoveButton = (button) => {
  button.className = "remove";
};

const handleEditEvent = (event, li, task) => {
  const input = document.querySelector(`[data-task-id="${task.id}"] input`);
  if (!input) {
    signals[task.id].abort();
    return;
  }
  const { x, y } = event;
  const { top, left, right, bottom } = li.getBoundingClientRect();
  if (x < left || x > right || y < top || y > bottom) {
    const tasks = loadStore();
    saveStore(
      tasks.map((t) => {
        if (t.id === task.id) {
          t.content = input.value;
        }
        return t;
      })
    );
    refreshList();
    signals[task.id].abort();
  }
};

const handleListItemTextClickEvent = (task) => {
  const li = document.querySelector(`[data-task-id="${task.id}"]`);
  const p = document.querySelector(`[data-task-id="${task.id}"] p`);
  const input = document.createElement("input");
  input.value = task.content;
  li.appendChild(input);
  input.focus();
  document.addEventListener(
    "click",
    (event) => handleEditEvent(event, li, task),
    {
      signal: signals[task.id].signal,
    }
  );
  p.remove();
};

const createListItem = (task, term = undefined) => {
  // li with span inside
  const controller = new AbortController();
  signals[task.id] = controller;
  const removeButton = document.createElement("button");
  removeButton.className = "remove hidden";
  removeButton.innerHTML = "<span>&#10006;</span>";
  removeButton.addEventListener("click", () => removeItem(task.id));
  const p = document.createElement("p");
  if (term && term.length > 2) {
    p.insertAdjacentHTML("beforeend", highlightTermInListItem(task, term));
  } else {
    const pText = document.createTextNode(task.content);
    p.appendChild(pText);
  }
  if (task.date) {
    p.appendChild(document.createTextNode(` (${task.date})`));
  }
  p.appendChild(removeButton);
  p.addEventListener("click", () => handleListItemTextClickEvent(task));
  const li = document.createElement("li");
  li.setAttribute("data-task-id", task.id);
  li.appendChild(p);
  li.addEventListener("mouseover", () => showRemoveButton(removeButton));
  li.addEventListener("mouseleave", () => hideRemoveButton(removeButton));
  return li;
};

const highlightTermInListItem = (task, term) => {
  const expression = `${term}`;
  let res = task.content.slice();
  const matches = task.content.matchAll(RegExp(expression, "gi"));
  const spanStart = "<span>";
  const spanEnd = "</span>";
  for (const match of matches) {
    const start = match.index;
    const end = match.index + match[0].length;
    res = res.slice(0, start) + spanStart + res.slice(start);
    res =
      res.slice(0, end + spanStart.length) +
      spanEnd +
      res.slice(end + spanStart.length);
  }
  return res;
};

const drawList = (tasks) => {
  const listElement = document.getElementById("tasks-list");
  const searchTerm = (
    document.getElementById("search")?.value || ""
  ).toLowerCase();
  let filteredTasks = null;
  if (searchTerm && searchTerm.length > 2) {
    filteredTasks = tasks.filter((t) => {
      const lowered = t.content.toLowerCase();
      return lowered.includes(searchTerm);
    });
  } else {
    filteredTasks = tasks;
  }
  const listItems = filteredTasks.map((task) => {
    const li = createListItem(task, searchTerm);
    return li;
  });
  listElement.replaceChildren(...listItems);
};

const refreshList = () => {
  if (Object.keys(signals)?.length) {
    signals = {};
  }
  const tasks = loadStore();
  if (tasks && tasks.length) {
    drawList(tasks);
  } else {
    const listElement = document.getElementById("tasks-list");
    listElement.replaceChildren();
  }
};

const validateTaskContent = (content) => {
  if (!content) {
    return false;
  }
  if (content.length < 4) {
    return false;
  }
  if (content.length > 255) {
    return false;
  }
  return true;
};

const addTaskEventHandler = () => {
  const taskContentInput = document.getElementById("new-task-content");
  const taskEndDateElement = document.getElementById("new-task-end-date");
  const taskContent = taskContentInput.value;
  const taskEndDate = taskEndDateElement.valueAsDate;
  const today = new Date();
  if (
    validateTaskContent(taskContent) &&
    (!taskEndDate || taskEndDate >= today)
  ) {
    const listElement = document.getElementById("tasks-list");
    const lastTask = listElement.lastChild;
    let newId = 1;
    if (lastTask) {
      const lastTaskId = parseInt(lastTask.getAttribute("data-task-id"));
      newId = lastTaskId + 1;
    }
    const newTask = {
      id: newId,
      content: taskContent,
    };
    if (taskEndDate) {
      newTask.date = taskEndDateElement.value;
    }
    // Add task to localStorage
    const tasks = loadStore() || [];
    tasks.push(newTask);
    saveStore(tasks);
    refreshList();
    taskEndDateElement.value = "";
    taskContentInput.value = "";
  } else {
    console.error("Task content or end date invalid");
  }
};

const handleSearchEvent = () => {
  refreshList();
};

const handleClearEvent = () => {
  localStorage.removeItem("tasks");
  refreshList();
};

const clearSearchElement = () => {
  const searchElement = document.getElementById("search");
  searchElement.value = "";
  refreshList();
};

const clearNewTaskContent = () => {
  const el = document.getElementById("new-task-content");
  el.value = "";
};

const main = () => {
  refreshList();
  const addTaskButton = document.getElementById("new-task-confirm");
  addTaskButton.addEventListener("click", addTaskEventHandler);
  const searchElement = document.getElementById("search");
  searchElement.addEventListener("keyup", handleSearchEvent);
  const clearButton = document.getElementById("clear-list");
  clearButton.addEventListener("click", handleClearEvent);
  const controlsElement = document.getElementById("controls");
  // Global events
  document.addEventListener("click", (event) => {
    if (event.target != searchElement) {
      clearSearchElement();
    }
  });
  document.addEventListener("mousedown", (event) => {
    const { x, y } = event;
    const { top, bottom, left, right } =
      controlsElement.getBoundingClientRect();
    if (x < left || x > right || y < top || y > bottom) {
      // Clicked outside controls space
      clearNewTaskContent();
    }
  });
};

document.body.onload = main;
