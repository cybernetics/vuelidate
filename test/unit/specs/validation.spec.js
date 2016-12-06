import Vue from 'vue'

function isEven (v) {
  return v % 2 === 0
}

function isOdd (v) {
  return v % 2 === 1
}

function isUnique (value) {
  return new Promise((resolve, reject) => {
    resolve(typeof value === 'string' && value.length % 2 !== 0)
  })
}

const T = () => true
const F = () => false

const base = {
  data () {
    return {
      value: 4
    }
  }
}

const baseString = {
  data () {
    return {
      value: 'x'
    }
  }
}

const baseGroup = {
  data () {
    return {
      value1: 1,
      value2: 2,
      nested: {
        value3: 3,
        value4: 4
      }
    }
  }
}

describe('Validation plugin', () => {
  it('should not have a $v key if not used', () => {
    const vm = new Vue(base)
    expect(vm.$v).to.not.exist
  })

  it('should have a $v key defined if used', () => {
    const vm = new Vue({
      ...base,
      validations: {
        value: { isEven }
      }
    })
    expect(vm.$v).to.exist
  })

  it('should not interfere with lifecycle hooks', () => {
    const createSpy = sinon.spy()
    const Ctor = Vue.extend({
      created: createSpy,
      ...base,
      validations: {}
    })
    const vm = new Ctor()
    expect(vm.$v).to.exist
    expect(createSpy).to.have.been.calledOnce
  })

  describe('$v.value.$pending', () => {
    it('should be false when handling synchronous validations', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isEven }
        }
      })
      expect(vm.$v.value.$pending).to.be.false
    })
    it('should be true when pending asynchronous validations', (done) => {
      const vm = new Vue({
        ...baseString,
        validations: {
          value: { isUnique }
        }
      })
      // TODO: This shouldn’t be needed here
      vm.$v.value.$touch()
      vm.value = 'x1'
      vm.$nextTick(() => {
        expect(vm.$v.value.$pending).to.be.true
        done()
      })
    })
  })

  describe('$v.value.$dirty', () => {
    it('should have a $dirty set to false on initialization', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isEven }
        }
      })
      expect(vm.$v.value.$dirty).to.be.false
    })

    it('should have a $error set to false on initialization', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isEven }
        }
      })
      expect(vm.$v.value.$error).to.be.false
    })
    it('should have a $error false on dirty valid', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isEven }
        }
      })
      vm.$v.value.$touch()
      expect(vm.$v.value.$error).to.be.false
    })
    it('should have a $error true on dirty invalid', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isOdd }
        }
      })
      vm.$v.value.$touch()
      expect(vm.$v.value.$error).to.be.true
    })
    it('should have a $error false on clean invalid', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isOdd }
        }
      })
      expect(vm.$v.value.$error).to.be.false
    })
    it('should have a $dirty set to true after $touch', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isEven }
        }
      })
      vm.$v.value.$touch()
      expect(vm.$v.value.$dirty).to.be.true
    })
    it('should have a $dirty set to false after $reset', () => {
      const vm = new Vue({
        ...base,
        validations: {
          value: { isEven }
        }
      })
      vm.$v.value.$touch()
      vm.$v.value.$reset()
      expect(vm.$v.value.$dirty).to.be.false
    })
    describe('for nested validators', () => {
      it('should have nested $dirty false on initialization', () => {
        const vm = new Vue({
          ...baseGroup,
          validations: {
            nested: {
              value1: { T },
              value2: { T }
            }
          }
        })
        expect(vm.$v.nested.$dirty).to.be.false
      })
      it('should have nested.$dirty false when only one value is $dirty', () => {
        const vm = new Vue({
          ...baseGroup,
          validations: {
            nested: {
              value1: { T },
              value2: { T }
            }
          }
        })
        vm.$v.nested.value1.$touch()
        expect(vm.$v.nested.$dirty).to.be.false
      })
      it('should have nested.$dirty true when all values are $dirty', () => {
        const vm = new Vue({
          ...baseGroup,
          validations: {
            nested: {
              value1: { T },
              value2: { T }
            }
          }
        })
        vm.$v.nested.value1.$touch()
        vm.$v.nested.value2.$touch()
        expect(vm.$v.nested.$dirty).to.be.true
      })
      it('should propagate nested.$touch to all nested values', () => {
        const vm = new Vue({
          ...baseGroup,
          validations: {
            nested: {
              value1: { T },
              value2: { T }
            }
          }
        })
        vm.$v.nested.$touch()
        expect(vm.$v.nested.value1.$dirty).to.be.true
        expect(vm.$v.nested.value2.$dirty).to.be.true
      })
      it('should propagate nested.$reset to all nested values', () => {
        const vm = new Vue({
          ...baseGroup,
          validations: {
            nested: {
              value1: { T },
              value2: { T }
            }
          }
        })
        vm.$v.nested.value1.$touch()
        vm.$v.nested.$reset()
        expect(vm.$v.nested.value1.$dirty).to.be.false
        expect(vm.$v.nested.value2.$dirty).to.be.false
      })
    })
  })

  describe('$v.value', () => {
    describe('when validations pass', () => {
      it('should have $invalid value set to false', () => {
        const vm = new Vue({
          ...base,
          validations: {
            value: { isEven }
          }
        })
        expect(vm.$v.value.$invalid).to.be.false
      })
      it('should have validator name value set to true', () => {
        const vm = new Vue({
          ...base,
          validations: {
            value: { isEven }
          }
        })
        expect(vm.$v.value.isEven).to.be.true
      })
    })
    describe('when validations did not pass', () => {
      it('should have $invalid value set to true', () => {
        const vm = new Vue({
          ...base,
          data () {
            return {
              value: 5
            }
          },
          validations: {
            value: { isEven }
          }
        })
        expect(vm.$v.value.$invalid).to.be.true
      })
      it('should have validator name value set to false', () => {
        const vm = new Vue({
          ...base,
          data () {
            return {
              value: 5
            }
          },
          validations: {
            value: { isEven }
          }
        })
        expect(vm.$v.value.isEven).to.be.false
      })
    })
    describe('when multiple validations exist', () => {
      it('should have the $invalid key set to true', () => {
        const vm = new Vue({
          ...base,
          validations: {
            value: { isEven, isOdd }
          }
        })
        expect(vm.$v.value.$invalid).to.be.true
        expect(vm.$v.value.isEven).to.be.true
        expect(vm.$v.value.isOdd).to.be.false
      })
    })
  })

  describe('nested fields', () => {
    it('should have accessible subvalidators with appropriate $invalid field', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          nested: {
            value3: { T },
            value4: { F }
          }
        }
      })
      expect(vm.$v.nested.value3.$invalid).to.be.false
      expect(vm.$v.nested.value4.$invalid).to.be.true
    })

    it('should have $invalid value set to true on single nested fail', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          nested: {
            value3: { T },
            value4: { F }
          }
        }
      })
      expect(vm.$v.nested.$invalid).to.be.true
    })

    it('should have $invalid value set to false when all nested pass', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          nested: {
            value3: { isOdd },
            value4: { isEven }
          }
        }
      })
      expect(vm.$v.nested.$invalid).to.be.false
    })
  })

  describe('validator groups', () => {
    it('should have $invalid value set to true when value1 fail', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          group: ['value1', 'nested.value3', 'nested.value4'],
          value1: { isEven },
          nested: {
            value3: { isOdd },
            value4: { isEven }
          }
        }
      })
      expect(vm.$v.group.$invalid).to.be.true
    })
    it('should have $invalid value set to true when nested.value3 fail', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          group: ['value1', 'nested.value3', 'nested.value4'],
          value1: { isOdd },
          nested: {
            value3: { isEven },
            value4: { isEven }
          }
        }
      })
      expect(vm.$v.group.$invalid).to.be.true
    })
    it('should have $invalid value set to false when all grouped pass', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          group: ['value1', 'nested.value3', 'nested.value4'],
          value1: { isOdd },
          nested: {
            value3: { isOdd },
            value4: { isEven }
          }
        }
      })
      expect(vm.$v.group.$invalid).to.be.false
    })
    it('should have $invalid value set to true when grouping undefined validators', () => {
      const vm = new Vue({
        ...baseGroup,
        validations: {
          group: ['value1', 'nested.value3', 'nested.value4', 'abc.def', 'abc.def.ghi'],
          value1: { isOdd },
          nested: {
            value4: { isEven }
          }
        }
      })
      expect(vm.$v.group['abc.def.ghi']).to.be.false
      expect(vm.$v.group.$invalid).to.be.true
    })
  })
  describe('validating collections with $each', () => {
    const vmDef = (validator, tracker) => ({
      data () {
        return {
          list: [{
            value: 1
          }, {
            value: 2
          }]
        }
      },
      validations: {
        list: {
          $each: {
            $trackBy: tracker,
            value: {
              validator
            }
          }
        }
      }
    })

    it('should create validators for list items', () => {
      const vm = new Vue(vmDef(isEven))
      expect(vm.$v.list.$each[0]).to.exist
      expect(vm.$v.list.$each[1]).to.exist
      expect(vm.$v.list.$each[2]).to.not.exist
    })
    it('should validate all items in list', () => {
      const vm = new Vue(vmDef(isEven))
      expect(vm.$v.list.$each[0].$invalid).to.be.true
      expect(vm.$v.list.$each[1].$invalid).to.be.false
    })
    it('should be $invalid when some elements are invalid', () => {
      const vm = new Vue(vmDef(isEven))
      expect(vm.$v.list.$invalid).to.be.true
    })
    it('should not be $invalid when all elements are valid', () => {
      const vm = new Vue(vmDef(T))
      expect(vm.$v.list.$invalid).to.be.false
    })
    it('should track additions and validate immediately', () => {
      const vm = new Vue(vmDef(isEven))
      vm.list.push({value: 3})
      vm.list.push({value: 4})
      expect(vm.$v.list.$each[0]).to.exist
      expect(vm.$v.list.$each[1]).to.exist
      expect(vm.$v.list.$each[2]).to.exist
      expect(vm.$v.list.$each[3]).to.exist
      expect(vm.$v.list.$each[4]).to.not.exist
      expect(vm.$v.list.$each[0].$invalid).to.be.true
      expect(vm.$v.list.$each[1].$invalid).to.be.false
      expect(vm.$v.list.$each[2].$invalid).to.be.true
      expect(vm.$v.list.$each[3].$invalid).to.be.false
    })
    it('should not loose $dirty after insertion based by index', () => {
      const vm = new Vue(vmDef(isEven))
      vm.$v.list.$each[0].$touch()
      vm.list.unshift({value: 0})
      expect(vm.$v.list.$each[0].$dirty).to.be.true
      expect(vm.$v.list.$each[1].$dirty).to.be.false
    })
    it('should not loose $dirty after insertion based by $trackBy', () => {
      const vm = new Vue(vmDef(isEven, 'value'))
      vm.$v.list.$each[0].$touch()
      vm.list.unshift({value: 0})
      expect(vm.$v.list.$each[0].$dirty).to.be.false
      expect(vm.$v.list.$each[1].$dirty).to.be.true
    })
    it('should share validators when $trackBy overlap', () => {
      const vm = new Vue(vmDef(isEven, 'value'))
      vm.list.unshift({value: 1})
      expect(vm.$v.list.$each[0]).to.be.equal(vm.$v.list.$each[1])
      expect(vm.$v.list.$each[0].$dirty).to.be.false
    })
    it('should share validators when functional $trackBy overlap', () => {
      const vm = new Vue(vmDef(isEven, x => x.value))
      vm.list.unshift({value: 1})
      expect(vm.$v.list.$each[0]).to.be.equal(vm.$v.list.$each[1])
      expect(vm.$v.list.$each[0].$dirty).to.be.false
    })
    it('should share validators when $trackBy overlap after initial get', () => {
      const vm = new Vue(vmDef(isEven, 'value'))
      vm.$v.list.$each[0].$touch()
      vm.list.unshift({value: 1})
      expect(vm.$v.list.$each[0]).to.be.equal(vm.$v.list.$each[1])
      expect(vm.$v.list.$each[0].$dirty).to.be.true
    })
  })
})
