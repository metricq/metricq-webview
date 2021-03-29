// @vue/component
export const InteractionArrayOption = {
  props: {
    action: {
      type: Array,
      required: true
    }
  },
  data: function () {
    return {
      functionList: ['uiInteractPan', 'uiInteractZoomArea', 'uiInteractZoomIn', 'uiInteractLegend', 'uiInteractZoomWheel'],
      eventList: ['none', 'drag', 'drop', 'move', 'wheel']
    }
  },
  computed: {
    functionName: {
      get: function () {
        return this.action[2]
      },
      set: function (newValue) {
        const newAction = this.action
        newAction[2] = newValue
        this.$emit('input', newAction)
      }
    },
    keyField: {
      get: function () {
        let keyStr = ''
        const keyCodeArray = this.action[1]
        for (let i = 0; i < keyCodeArray.length; ++i) {
          let curKeyCode = keyCodeArray[i]
          if (curKeyCode.length > 0) {
            const isNegated = (curKeyCode.charAt(0) === '!')
            if (isNegated) {
              curKeyCode = curKeyCode.substring(1)
            }
            curKeyCode = parseInt(curKeyCode)
            for (const curKeyName in window.KeyJS) {
              if (curKeyCode === window.KeyJS[curKeyName]) {
                if (keyStr.length > 0) {
                  keyStr += ' '
                }
                if (isNegated) {
                  keyStr += '!'
                }
                keyStr += curKeyName
                break
              }
            }
          }
        }
        return keyStr
      },
      set: function (newValue) {
        const rawEntriesArray = newValue.split(' ')
        const actionKeyArray = []
        for (let i = 0; i < rawEntriesArray.length; ++i) {
          let curEntry = rawEntriesArray[i]
          if (curEntry.length > 0) {
            let newEntry = ''
            if (curEntry.charAt(0) === '!') {
              curEntry = curEntry.substring(1)
              newEntry += '!'
              if (curEntry.length === 0) {
                continue
              }
            }
            if (curEntry.match(/^[0-9]+$/)) {
              newEntry += curEntry
            } else {
              if (undefined !== window.KeyJS[curEntry.toUpperCase()]) {
                newEntry += '' + window.KeyJS[curEntry.toUpperCase()]
              }
            }
            actionKeyArray.push(newEntry)
          }
        }
        const newAction = this.action
        newAction[1] = actionKeyArray
        this.$emit('input', newAction)
        // this.action[1] = actionKeyArray
      }
    },
    eventName: {
      get: function () {
        return this.action[0]
      },
      set: function (newValue) {
        const newAction = this.action
        newAction[0] = newValue
        this.$emit('input', newAction)
        // this.action[0] = newValue
      }
    }
  },
  template: `<div class="form-group row" >
    <label class="col-sm-5 col-form-label">{{ functionName }}</label>
    <div class="col-sm-4">
    <select class="form-control custom-select" size="1" v-model="eventName">
    <option v-for="curEvent in eventList" v-bind:value="curEvent">{{ curEvent }}</option>
    </select>
    </div>
    <div class="col-sm-3">
    <input type="text" class="form-control" v-model="keyField"/>
    </div>
    </div>`
}
