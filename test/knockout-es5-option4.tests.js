chai.Assertion.addProperty('observable', function() {
  this.assert(
    ko.isObservable(this._obj),
    'expected #{this} to be an observable',
    'expected #{this} to not be an observable'
  )
})

describe('knockout-es5-option4', function() {
  describe('defineObservableProperty', function() {
    it('should define an enumerable property', function() {
      var foo = {}

      ko.utils.defineObservableProperty(foo, 'name')

      var descriptor = Object.getOwnPropertyDescriptor(foo, 'name')
      descriptor.enumerable.should.be.true
      descriptor.configurable.should.be.true
      descriptor.get.should.be.a('function')
      descriptor.set.should.be.a('function')
    })

    it('should set a default if provided', function() {
      var foo = {}

      ko.utils.defineObservableProperty(foo, 'name', 'Bob')

      foo.name.should.equal('Bob')
    })

    it('should define an non-enumerable property to access the observable', function() {
      var foo = {}

      ko.utils.defineObservableProperty(foo, 'name')

      var descriptor = Object.getOwnPropertyDescriptor(foo, '_name')
      descriptor.enumerable.should.be.false
      descriptor.configurable.should.be.false
      descriptor.get.should.be.a('function')
      should.not.exist(descriptor.set)

      ko.isObservable(foo._name).should.be.true
    })

    it('should special case arrays and create an observableArray', function() {
      var foo = {}

      ko.utils.defineObservableProperty(foo, 'friends', [])

      ko.isObservable(foo._friends).should.be.true
      foo._friends.push.should.be.a('function')
    })

    it('should mixin ko.observableArray functions into any arrays, even through updates', function() {
      var foo = {},
          checkMixinKeys = function() {
            ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'].forEach(function(f) {
              Object.getOwnPropertyDescriptor(foo.friends, f).enumerable.should.be.false
            })
          }

      ko.utils.defineObservableProperty(foo, 'friends', [{ name: 'Bob'}, { name: 'Jill' }])
      checkMixinKeys()
      foo.friends.should.deep.equal([{ name: 'Bob'}, { name: 'Jill' }])

      foo.friends.push({ name: 'Alice' })
      checkMixinKeys()
      foo.friends.should.deep.equal([{ name: 'Bob'}, { name: 'Jill' }, { name: 'Alice' }])

      foo.friends = [{ name: 'John' }]
      checkMixinKeys()
      foo.friends.should.deep.equal([{ name: 'John' }])
    })

    it('should deeply observify objects by default', function() {
      var foo = {}

      ko.utils.defineObservableProperty(foo, 'friends', [{
        name: 'Bob',
        titles: ['mr', 'sir']
      }])

      ko.isObservable(foo._friends).should.be.true
      foo._friends.push.should.be.a('function')

      ko.isObservable(foo.friends[0]._name).should.be.true
      ko.isObservable(foo.friends[0]._titles).should.be.true
    })

    it('should not deeply observify objects if requested', function() {
      var foo = {}

      ko.utils.defineObservableProperty(foo, 'friends', [{
        name: 'Bob',
        kids: {
          sally: 10,
          sue: 5
        }
      }], false)

      ko.isObservable(foo.friends[0]._kids).should.be.false
      foo.friends[0].kids.should.not.haveOwnProperty('_sally')
      foo.friends[0].kids.sally.should.equal(10)
    })
  })

  describe('observableModel', function() {
    it('should create an object with observable properties', function() {
      var obj = ko.observableModel({
        name: 'Bob',
        age: undefined
      })

      var nameDescriptor = Object.getOwnPropertyDescriptor(obj, 'name')
      nameDescriptor.get.should.be.a('function')
      nameDescriptor.set.should.be.a('function')
      nameDescriptor.enumerable.should.be.true

      var ageDescriptor = Object.getOwnPropertyDescriptor(obj, 'age')
      ageDescriptor.get.should.be.a('function')
      ageDescriptor.set.should.be.a('function')
      ageDescriptor.enumerable.should.be.true

      obj.name.should.equal('Bob')
      should.not.exist(obj.age)
    })

    it('should create observable properties deeply', function() {
      var obj = ko.observableModel({
        name: 'Bob',
        job: {
          title: undefined,
          company: 'acme'
        }
      })

      var jobTitleDescriptor = Object.getOwnPropertyDescriptor(obj.job, 'title')
      jobTitleDescriptor.get.should.be.a('function')
      jobTitleDescriptor.set.should.be.a('function')
      jobTitleDescriptor.enumerable.should.be.true

      var jobDescriptor = Object.getOwnPropertyDescriptor(obj, 'job')
      jobDescriptor.get.should.be.a('function')
      jobDescriptor.set.should.be.a('function')

      obj.name.should.equal('Bob')
      obj.job.company.should.equal('acme')
    })

    it('should not create observable properties deeply if requested', function() {
      var obj = ko.observableModel({
        name: 'Bob',
        job: {
          title: undefined,
          company: 'acme'
        }
      }, false)

      var jobTitleDescriptor = Object.getOwnPropertyDescriptor(obj.job, 'title')
      should.not.exist(jobTitleDescriptor.set)
      should.not.exist(jobTitleDescriptor.get)

      var jobDescriptor = Object.getOwnPropertyDescriptor(obj, 'job')
      jobDescriptor.get.should.be.a('function')
      jobDescriptor.set.should.be.a('function')

      obj.name.should.equal('Bob')
      obj.job.company.should.equal('acme')
    })

    it('should special case arrays and create an observableArray', function() {
      var obj = ko.observableModel({
        name: 'Bob',
        friends: ['Jane', 'Jill']
      })

      obj._friends.should.be.an.observable
      obj._friends.push.should.be.a('function')
      obj.friends[0].should.equal('Jane')
    })

    it('should not define properties for subscribables', function() {
      var obj = ko.observableModel({
        name: 'Bob',
        friends: ko.observableArray()
      })

      var friendsDescriptor = Object.getOwnPropertyDescriptor(obj, 'friends')
      should.not.exist(friendsDescriptor.get)
      should.not.exist(friendsDescriptor.set)

      obj.friends.should.be.an.observable
    })

    it('should deeply create observableModels from arrays of objects', function() {
      var obj = ko.observableModel({
        name: 'Bob',
        friends: [{
          name: 'Jill'
        }, {
          name: ko.computed(function() {
            return 'Jane'
          })
        }]
      })

      obj._friends.should.be.an.observable
      obj._friends.push.should.be.a('function')
      obj.friends[0].name.should.equal('Jill')
      obj.friends[0]._name.should.be.an.observable
      should.not.exist(obj.friends[1]._name)
      obj.friends[1].name().should.equal('Jane')
    })
  })

  describe('observifyModel', function() {
    it('should return the same object', function() {
      var orig = {
        name: 'Bob',
        age: 30
      }
      var model = ko.observifyModel(orig)

      model.should.equal(orig)
    })

    it('should be idempotent and not overwrite previous observable properties', function() {
      var model = ko.observableModel({
        name: 'Bob',
        friends: [{
          name: 'Jane'
        }, {
          name: 'John'
        }]
      }),
      sub = sinon.spy()

      model._friends.should.be.an.observable
      model.friends[1]._name.should.be.an.observable

      model._friends.subscribe(sub)
      model.friends.push({ name: 'Jill' })
      should.not.exist(model.friends[2]._name)
      sub.should.have.been.calledOnce

      ko.observifyModel(model)
      model.friends[2]._name.should.be.an.observable

      model.friends.push({ name: 'Thomas' })
      sub.should.have.been.calledTwice
      sub.lastCall.args[0][3].should.deep.equal({ name: 'Thomas' })
    })

    it('should be idempotent to existing observables while merging new values and observifying', function() {
      var model = ko.observableModel({
        name: 'Bob',
        friends: [{
          name: 'Jane'
        }, {
          name: 'John'
        }]
      }),
      friendSub = sinon.spy(),
      firstFriendSub = sinon.spy(),
      secondFriendSub = sinon.spy()

      model._friends.subscribe(friendSub)
      model.friends[0]._name.subscribe(firstFriendSub)
      model.friends[1]._name.subscribe(secondFriendSub)

      ko.observifyModel(model, {
        friends: [{
          name: 'Jill'
        }, {
          name: 'John'
        }, {
          name: 'Thomas'
        }]
      })

      friendSub.should.have.been.calledOnce
      firstFriendSub.should.have.been.calledOnce
      secondFriendSub.should.have.not.been.called
      model.friends[0].name.should.equal('Jill')
      model.friends[1].name.should.equal('John')
      model.friends[2].name.should.equal('Thomas')
      model.friends[2]._name.should.be.an.observable

      model.friends[1].name = 'Bob'
      secondFriendSub.should.have.been.calledWith('Bob')
    })

    it('should not observify arrays of non-objects', function() {
      var model = ko.observableModel({
        name: 'Bob',
        friends: []
      })

      model._friends.should.be.an.observable
      model._friends.push.should.be.a('function')
      model._name.should.be.an.observable
      var origFriendsObservable = model._friends
      var origNameObservable = model._name

      ko.observifyModel(model, {
        name: 'Brian',
        friends: ['Jill', 'Jane']
      })

      model._friends.should.be.an.observable
      model._friends.should.equal(origFriendsObservable)
      model.name.should.equal('Brian')
      model._name.should.equal(origNameObservable)
      model.friends[0].should.be.a('string').and.equal('Jill')
      model.friends[1].should.be.a('string').and.equal('Jane')
      should.not.exist(model.friends._0)
      should.not.exist(model.friends._length)
    })

    it('should not deeply observify if requested', function() {
      var model = {
        name: 'Bob',
        friends: [{
          name: 'Jane'
        }, {
          name: ko.observable('John')
        }]
      }

      ko.observifyModel(model, false)
      model._name.should.be.an.observable
      model._friends.should.be.an.observable
      model.friends[0].name.should.equal('Jane')
      should.not.exist(model.friends[0]._name)
      model.friends[1].name.should.be.an.observable
      model.friends[1].name().should.equal('John')
    })

    it('should not observify array properties but array items if deeply observifying', function() {
      var model = [{
        name: 'Bob',
        age: 30
      }, {
        name: 'Jane',
        age: 25
      }]

      ko.observifyModel(model)
      should.not.exist(model._0)
      should.not.exist(model._1)

      model[0]._name.should.be.an.observable
      model[1]._name.should.be.an.observable
      model[0]._age.should.be.an.observable
      model[1]._age.should.be.an.observable

      model.should.deep.equal([{
        name: 'Bob',
        age: 30
      }, {
        name: 'Jane',
        age: 25
      }])
    })

    describe('arrayMapping', function() {
      it('for properties that are arrays, it should match items in the array by the property that is the value of the arrayMapping property', function() {
        var model = ko.observableModel({
          name: 'Bob',
          friends: [{
            name: 'Jane',
            age: 28
          }, {
            name: 'John',
            age: 35,
            email: 'john@email.com'
          }]
        })

        ko.observifyModel(model, {
          friends: [{
            name: 'John',
            age: 31
          }, {
            name: 'Jill',
            age: 25
          }]
        }, true, {
          friends: 'name'
        })

        model.friends.length.should.equal(3)
        model._friends.should.be.an.observable
        model.friends[0].name.should.equal('Jane')
        model.friends[1].name.should.equal('John')
        model.friends[1]._name.should.be.an.observable
        model.friends[1].email.should.equal('john@email.com')
        model.friends[1]._email.should.be.an.observable
        model.friends[1].age.should.equal(31)
        model.friends[1]._age.should.be.an.observable
        model.friends[2].should.deep.equal({ name: 'Jill', age: 25 })
      })

      it('should not map arrays not specified', function() {
        var model = ko.observableModel({
          name: 'Bob',
          friends: [{
            name: 'Jane',
            age: 28,
            favoriteColors: ['blue', 'yellow'],
            cars: [{
              makeAndModel: 'BMW-M3',
              color: 'blue',
              condition: 'good'
            }, {
              makeAndModel: 'Tesla-ModelS',
              color: 'yellow'
            }]
          }, {
            name: 'John',
            age: 35,
            email: 'john@email.com',
            favoriteColors: ['red', 'green'],
            cars: [{
              makeAndModel: 'Honda-Civic',
              color: 'red'
            }]
          }]
        })

        ko.observifyModel(model, {
          friends: [{
            name: 'Jill',
            age: 25,
            cars: [{
              makeAndModel: 'Mazda3',
              color: 'white'
            }]
          }, {
            name: 'John',
            age: 31,
            favoriteColors: ['silver', 'red'],
            cars: [{
              makeAndModel: 'BMW-M3',
              color: 'silver',
              condition: 'poor'
            }]
          }, {
            name: 'Jane',
            favoriteColors: ['white', 'black', 'orange'],
            cars: [{
              makeAndModel: 'Tesla-ModelS',
              color: 'orange'
            }, {
              makeAndModel: 'BMW-M3',
              color: 'black'
            }]
          }]
        }, true, {
          friends: 'name',
          cars: 'makeAndModel'
        })

        model.friends.length.should.equal(3)
        model._friends.should.be.an.observable
        model.friends[0].should.deep.equal({
          name: 'Jane',
          age: 28,
          favoriteColors: ['white', 'black', 'orange'],
          cars: [{
            makeAndModel: 'BMW-M3',
            color: 'black',
            condition: 'good'
          }, {
            makeAndModel: 'Tesla-ModelS',
            color: 'orange'
          }]
        })
        model.friends[1].should.deep.equal({
          name: 'John',
          age: 31,
          email: 'john@email.com',
          favoriteColors: ['silver', 'red'],
          cars: [{
            makeAndModel: 'Honda-Civic',
            color: 'red'
          }, {
            makeAndModel: 'BMW-M3',
            color: 'silver',
            condition: 'poor'
          }]
        })
        model.friends[2].should.deep.equal({
          name: 'Jill',
          age: 25,
          cars: [{
            makeAndModel: 'Mazda3',
            color: 'white'
          }]
        })
      })

      it('should not loose any properties when mapping', function() {
        var model = ko.observableModel({
          name: 'Bob',
          friends: [{
            name: 'Jane',
            age: 28
          }, {
            name: 'John',
            age: 35,
            email: 'john@email.com'
          }]
        })

        ko.observifyModel(model, {
          friends: [{
            name: 'John',
            favoriteColors: ['blue', 'green']
          }, {
            name: 'Jane',
            favoriteColors: ['pink', 'silver']
          }]
        }, true, {
          friends: 'name'
        })

        model.should.deep.equal({
          name: 'Bob',
          friends: [{
            name: 'Jane',
            age: 28,
            favoriteColors: ['pink', 'silver']
          }, {
            name: 'John',
            age: 35,
            email: 'john@email.com',
            favoriteColors: ['blue', 'green']
          }]
        })
      })

      it('should not map arrays of arrays', function() {
        var model = ko.observableModel({
          matrix: [[{ id: 2 }], [{ id: 8 }], [{ id: 10 }]],
          '0': [{
            id: 1,
            name: 'Bob'
          }, {
            id: 4,
            name: 'Jill'
          }]
        })

        ko.observifyModel(model, {
          matrix: [[{ id: 0 }], [{ id: 5 }]],
          '0': [{
            id: 4,
            name: 'Jane'
          }, {
            id: 2,
            name: 'Jill'
          }]
        }, true, {
          '0': 'id'
        })

        model.should.deep.equal({
          matrix: [[{ id: 0 }], [{ id: 5 }], [{ id: 10 }]],
          '0': [{
            id: 1,
            name: 'Bob'
          }, {
            id: 4,
            name: 'Jane'
          }, {
            id: 2,
            name: 'Jill'
          }]
        })
      })

      it('should not try to map if the defaults for a prop is not an array', function() {
        var model = ko.observableModel({
          friends: [{
            name: 'Jane',
            favoriteColors: [{ color: 'white', hex: '0xFFF'}]
          }, {
            name: 'John',
            favoriteColors: 'red and blue'
          }]
        })

        ko.observifyModel(model, {
          friends: [{
            name: 'John',
            favoriteColors: [{ color: 'blue', hex: '0x00F'}]
          }, {
            name: 'Jane',
            favoriteColors: NaN
          }]
        }, true, {
          friends: 'name',
          favoriteColors: 'color'
        })

        model.should.deep.equal({
          friends: [{
            name: 'Jane',
            favoriteColors: [{ color: 'white', hex: '0xFFF'}]
          }, {
            name: 'John',
            favoriteColors: [{ color: 'blue', hex: '0x00F'}]
          }]
        })
      })

      it('should handle sparse or inconsistent source and destination arrays', function() {
        var model = ko.observableModel({
          friends: [{
            name: 'Jane',
            cars: [null, 'hi', {
              makeAndModel: 'BMW-M3',
              color: 'blue',
              condition: 'good'
            }, {
              makeAndModel: 'Tesla-ModelS',
              color: 'yellow'
            }]
          }, {
            name: 'John',
            cars: [{
              makeAndModel: 'Honda-Civic',
              color: 'red'
            }]
          }]
        }),
        johnsCars = []
        johnsCars[4] = {
          makeAndModel: 'BMW-M3',
          color: 'silver',
          condition: 'poor'
        }

        ko.observifyModel(model, {
          friends: [{
            name: 'John',
            cars: johnsCars
          }, {
            name: 'Jane',
            cars: [10, {
              makeAndModel: 'Tesla-ModelS',
              color: 'orange'
            }, {
              makeAndModel: 'BMW-M3',
              color: 'black'
            }, undefined, NaN]
          }]
        }, true, {
          friends: 'name',
          cars: 'makeAndModel'
        })

        // a simple deep equal fails due to NaN !== NaN. same with undefined.
        model.friends[0].cars.length.should.equal(7)
        should.not.exist(model.friends[0].cars[5])
        isNaN(model.friends[0].cars[6]).should.be.true
        model.friends[0].cars.pop()
        model.friends[0].cars.pop()

        model.should.deep.equal({
          friends: [{
            name: 'Jane',
            cars: [null, 'hi', {
              makeAndModel: 'BMW-M3',
              color: 'black',
              condition: 'good'
            }, {
              makeAndModel: 'Tesla-ModelS',
              color: 'orange'
            }, 10]
          }, {
            name: 'John',
            cars: [{
              makeAndModel: 'Honda-Civic',
              color: 'red'
            }, {
              makeAndModel: 'BMW-M3',
              color: 'silver',
              condition: 'poor'
            }]
          }]
        })
      })
    })
  })
})