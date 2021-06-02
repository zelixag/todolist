<template>
  <section id="app" class="todoapp">
    <header class="header">
      <h1>todos</h1>
      <input
        class="new-todo"
        placeholder="What needs to be done?"
        autocomplete="off"
        autofocus
        v-model="input"
        @keyup.enter="addTodo"
        >
    </header>
    <section class="main" v-show="count">
      <input id="toggle-all" class="toggle-all" v-model="allDone" type="checkbox">
      <label for="toggle-all">Mark all as complete</label>
      <ul class="todo-list">
        <li
          v-for="todo in filteredTodos"
          :key="todo"
          :class="{ editing: todo === editingTodo, completed: todo.completed }"
        >
          <div class="view">
            <input class="toggle" type="checkbox" v-model="todo.completed">
            <label @dblclick="editTodo(todo)">{{ todo.text }}</label>
            <button class="destroy" @click="remove(todo)"></button>
          </div>
          <input
            class="edit"
            type="text"
            v-editing-focus="todo === editingTodo"
            v-model="todo.text"
            @keyup.enter="doneEdit(todo)"
            @blur="doneEdit(todo)"
            @keyup.esc="cancelEdit(todo)"
            >
        </li>
      </ul>
    </section>
    <footer class="footer" v-show="count">
      <span class="todo-count">
        <strong>{{ remainingCount }}</strong> {{ remainingCount > 1 ? 'items' : 'item' }} left
      </span>
      <ul class="filters" >
        <li><a href="#/all">All</a></li>
        <li><a href="#/active">Active</a></li>
        <li><a href="#/completed">Completed</a></li>
      </ul>
      <button class="clear-completed" v-show="count > remainingCount" @click="removeCompleted">
        Clear completed
      </button>
    </footer>
  </section>
  <footer class="info">
    <p>Double-click to edit a todo</p>
    <!-- Change this out with your name and url ↓ -->
    <p>Created by <a href="hhttps://juejin.cn/post/6966241604126375973/">Linx</a></p>
  </footer>
</template>

<script>
import './assets/index.css'
import useLocalStorage from './utils/useLocalStorage'
// import { postData, getData } from './utils/request'
import { ref } from '@vue/reactivity'
import { computed, onMounted, onUnmounted, watchEffect } from '@vue/runtime-core'

const storage = useLocalStorage()

// 1. 添加待办事项
const useAdd = todos => {
  // 使用ref 声明一个响应式基本数据，用于输入框的绑定，最后return出去
  const input = ref('')
  // 声明一个添加todo方法
  const addTodo = () => {
    const text = input.value && input.value.trim()

    if(text.length === 0) return;
    // 将todo存储到数组中，包括内容，和完成状态（添加时，未完成）
    // todos是响应式数据所以使用value
    todos.value.unshift({
      text,
      completed: false
    })
    input.value = ''
  }
  return {
    input,
    addTodo
  }
}

// 2. 删除待办事项
const useRemove = todos => {
    const remove = todo => {
        const index = todos.value.indexOf(todo)
        todos.value.splice(index, 1)
    }

    const removeCompleted = () => {
      todos.value = todos.value.filter(todo => !todo.completed)
    }

    return {
        remove,
        removeCompleted
    }
}

// 3. 编辑待办项
const useEdit= remove => {
  // 用于缓存编辑之前的内容，如果取消编辑则使用改值，这个值不影响dom更新，不需要ref
  let beforeEditingText = ''
  // 编辑内容，绑定编辑输入文本框
  const editingTodo = ref(null)
  const editTodo = todo => {
    beforeEditingText = todo.text;
    editingTodo.value = todo
  }
  // 如果编辑时，内容全部清空则为删除
  const doneEdit = todo => {
    if(!editingTodo.value) return
    todo.text = todo.text.trim()
    todo.text || remove(todo) // 删除
    editingTodo.value = null
  }

  const cancelEdit = todo => {
    editingTodo.value = null
    todo.text = beforeEditingText
  }

  return {
    editingTodo,
    editTodo,
    doneEdit,
    cancelEdit
  }
}

// 4. 切换待办项完成状态
const useFilter = todos => {
  // 声明全选状态计算属性 allDone
  const allDone = computed({
    get () {
      // 当todos全部为true时u，计算属性为true
      return !todos.value.filter(todo => !todo.completed).length
    },
    set (value) {
      // 当计算属性被设置时，同步todos里面所有状态与计算属性保持一致
      todos.value.forEach(todo => {
        todo.completed = value
      })
    }
  })
  const filter = {
      all: list => list,
      active: list => list.filter(todo => !todo.completed),
      completed: list => list.filter(todo => todo.completed),
    }

    const type = ref('all')
    const filteredTodos = computed(() => filter[type.value](todos.value))
    const remainingCount = computed(() => filter.active(todos.value).length)
    const count= computed(() => todos.value.length)
    const onHashChange = () => {
      // 获取地址的hash值
      const hash = window.location.hash.replace('#/', '')
      if(filter[hash]) {
        type.value = hash
      } else {
        type.value = 'all'
        window.location.hash = ''
      }
    }

    // 页面首次加载的时候，也要去获取onHashChange里面的数据
    onMounted(() => {
      window.addEventListener('hashchange', onHashChange)
      onHashChange()
    })

    onUnmounted(() => {
      window.removeEventListener('hashchange', onHashChange)
    })


  return {
    allDone,
    filteredTodos,
    remainingCount,
    count
  }
}

// 5. 存储待办事项
const useStorage = () => {
  const KEY = 'TODOKEYS'
  const todos = ref(storage.getItem(KEY) || [])
  watchEffect(() => {
    console.log('123')
    storage.setItem(KEY, todos.value)
  })
  return todos
}

export default {
  name: 'App',
  setup () {
    // 用于todo的存储，这个数据变化了todolist列表也要刷新所以也是响应式数据，使用ref
    const todos = useStorage()

    const { remove, removeCompleted } = useRemove(todos)
    return {
      todos,
      remove,
      removeCompleted,
      ...useAdd(todos),
      ...useEdit(remove),
      ...useFilter(todos),
    }
  },
  directives: {
    editingFocus: (el, binding) => {
      binding.value && el.focus()
    }
  }
}
</script>

<style>
</style>
