/**
 * Hi! I wanted to learn how frontend frameworks like Vue and React internally. So I built one.
 * All the code in this file is of a simple todolist application, along with the complete framework.
 * 
 * Actually, it's just a bunch of functions that call each other.
 * 
 * (isn't everything)
 * 
 * Before you begin reading this code, I really think you should read about reactivity systems and the virtual DOM
 * 
 * 
 * Our goal is to create a really simple frontend framework and a simple application on top of it.
 * I'm thinking our framework will be component based.
 * So, each component will have some HTML element it will render on to the screen, and also some state which will
 * define what the component renders.
 * 
 * A great representation for this would be an object. Each component in our framework will be a JSON object, which
 * has state, and the element it will render.
 * component = { state: {}, render(){} }
 * 
 * Now that we have established what our components will look like. Let's keep it aside for a moment, we'll come back to it in
 * some time
 */





 /**
  * First things first, what we do, we have to do after the document is loaded. So whenever this script loads the first
  * thing we do is attach a listener to the document for the DOMContentLoaded event.
  * 
  * As soon as the document is loaded we just call our renderRoot function. It does as its name suggests, renders to the root element.
  */
document.addEventListener("DOMContentLoaded", () => {
  renderRoot();
});




/**
 * If you look inside the render root component, it queries an element from the DOM.
 * Here, our root element is an element with the ID of "app". That element is where our app will be mounted.
 * 
 * If you open the index.html page inside this repository, you'll find there is already a <div> created with id="app"
 */
function renderRoot() {
  var root = document.getElementById("app");
  /**
   * Does the below line look familiar?
   * ReactDOM.render(rootElement, rootComponent)
   * 
   * Well, this line does the same thing. Without the syntax sugar. Also notice the makeReactive function call, we pass it a variable called
   * rootComponent which is the root component of our application and after making it reactive we just call the render function of the component
   * with a render function. We get the render function for the component by calling the getRenderFunction function with the component id
   * 
   * The makeReactive function call takes a component, makes its state reactive and returns the reactive component.
   * */
  updateNode(root, null, makeReactive(rootComponent).render(getRenderFunction(rootComponent.id)));
}




/**
 * What is the render function that we get from the getRenderFunction method
 * It's a function that takes three arguments and returns a single object with some keys.
 * 
 * The object returned by the render function is what we will make it easy for us to write HTML code inside our components.
 * It will basically allows us to write HTML elements in the form of function calls which we then translate into the real DOM
 * while we render the component using our virtual DOM
 * 
 * First key is, type. It tells us the type of the element we will be rendering.
 * Second, are attributes spread out using the spread operator in javascript, so this could be many key-value pairs.
 * Third is children, which will basically store all the children of our element.
 */
function getRenderFunction(componentID) {
  render = (type, attributes, children) => {
    attributesWithComponentID = {
      ...attributes,
      // We take whatever the attributes we receive and add our own id attribute to the element to help us get the DOM elements of our component
      attrs: {
        ...attributes.attrs,
        ffid: componentID
      }
    };
    return {
      type,
      ...attributesWithComponentID,
      children
    };
  }
  return render;
}



/**
 * Now let's look at our rootComponent.
 * As I said in the beginning of this file, every component in our framework is going to be a JavaScript object.
 * That object will have its own state, and the HTML elements it needs to render according to that state.
 */
const rootComponent = {
  id: 123,
  state: { // Our component's state
    name: "",
    task: "",
    taskList: [
      "Talk at React Delhi NCR",
      "Shut up when the time is up"
    ]
  },
  // The render function of our component. This is what's called on line 60.
  // The variable h, is the global function that just converts all its arguments into an object
  render(h) {
    return h(
      "div",
      {
        attrs: {
          class: "d-flex align-items-center justify-content-center h-100 w-100"
        }
      },
      [
        h(
          "div",
          { attrs: { class: "h-50 w-50 bg-white rounded shadow p-3" } },
          [
            h("div", { attrs: { class: "input-group" } }, [
              h("input", {
                attrs: {
                  value: this.task,
                  class: "form-control form-control-lg",
                  placeholder: "Enter Task"
                },
                events: {
                  input: e => {
                    this.task = e.target.value;
                  }
                }
              }),
              h("div", { attrs: { class: "input-group-append" } }, [
                h(
                  "button",
                  {
                    attrs: { class: "btn btn-primary" },
                    events: {
                      click: e => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.taskList = [...this.taskList, this.task];
                        this.task = "";
                      }
                    }
                  },
                  ["Add Task"]
                )
              ])
            ]),
            ...this.taskList.map(task =>
              h("div", { attrs: { class: "p-3 border-bottom" } }, [task])
            )
          ]
        )
      ]
    );
  }
};


/**
 * Here is the function that sprinkles a major ton of magic in our framework.
 * The reactivity system we will be using in our framework is going to be a pull-based system.
 * We won't be maintaining any watchers to keep track of component dependencies and instead render the complete subtree.
 * 
 * But still we would need to know whenever our component's state is updated. To do that, we make its state reactive using
 * getters and setters
 * 
 * Let's go line by line and see how it works
 */
function makeReactive(component) {
  // First, let's take the component we have received and deep clone it (just to drop object references)
  const reactiveComponent = JSON.parse(JSON.stringify(component));
  // Our deep clone above didn't copy the render function over as we stringified, so let's just quickly copy that too.
  reactiveComponent.render = component.render;

  Object.keys(reactiveComponent.state).forEach(stateKey => {
    // We go through each key inside the state of the component
    // and inside our new reactiveComponent we add the same key with getters and setters defined
    Object.defineProperty(reactiveComponent, stateKey, {
      get() {
        // the getter just returns the value of the state variable
        return this.state[stateKey] || "";
      },
      set(value) {
        // The setter, which is called whenever the the variable in the state is updated, we call the render function of the component again.
        // using which we get the JSON of the complete DOM tree we have to render.
        const olddom = this.render(render);
        // Next up, do what the setter is supposed to do, update the value of the state variable.
        this.state[stateKey] = value;
        // Then, we have the old state of component's render tree in the variable olddom
        // and we can get the new state of our component's render by calling the render function again as now the state value is updated
        // We pass both these values to the update node function with the root HTML element that our component renders (we get that by querying using component id)
        updateNode(document.querySelector(`[ffid="${this.id}"]`).parentElement, olddom, this.render(getRenderFunction(rootComponent.id)));
      }
    });
  });
  // In the end, just return the fresh off the stove, reactiveComponent
  return reactiveComponent;
}


/**
 * Now let's look at what our updateNode function does. It takes a parent element, and old dom node or tree representation and a new dom node or tree representation
 * Basicaly, the parent element, the old virtual DOM and the new virtual DOM. Also an index to keep track of siblings
 * 
 * Let's go inside the function and see how the process
 */
function updateNode(parent, oldnode, newnode, index = 0) {
  // Let's start simple. If the old node does not exist.
  if (!oldnode) {
    // Then, just simply append the new node to the parent element
    parent.appendChild(createDOMNode(newnode)); // Notice the createDOMNode function here, it translates our JSON representation of HTML element into an an actual DOM element
  } else if (!newnode) {
    // If the new node doesn't exist, means it was removed. So remove that node from the parent
    parent.removeChild(parent.childNodes[index]);
  } else if (diffNodes(oldnode, newnode)) {
    // If both the nodes exist. Check if the new node is different.
    // If they are, then replace the old node with the new node
    // If you want to look at how we diff two nodes, go to the diff nodes function
    parent.replaceChild(createDOMNode(newnode), parent.childNodes[index]);
  } else if (newnode.type) {
    // If the old and new nodes haven't changed, check if their children have changed
    // Recursion to the rescue. Loop through all children and call this function on each one of them.

    // Before we go to the children, let's also update the attributes of the nodes
    if (JSON.stringify(oldnode.attrs) !== JSON.stringify(newnode.attrs)) {
      if (parent.childNodes[index]) {
        Object.keys(oldnode.attrs).forEach(attr => {
          parent.childNodes[index].removeAttribute(attr);
        });
        Object.keys(newnode.attrs).forEach(attr => {
          if (parent.childNodes[index][attr]) {
            parent.childNodes[index][attr] = newnode.attrs[attr];
          } else {
            parent.childNodes[index].setAttribute(attr, newnode.attrs[attr]);
          }
        });
      }
    }

    // Now, select the child of the parent node and recursively call the updateNode function to diff the complete DOM
    if (newnode.children || oldnode.children) {
      for (
        var i = 0;
        i < (newnode.children.length || 0) ||
        i < (oldnode.children.length || 0);
        i++
      ) {
          updateNode(
            parent.childNodes[index],
            oldnode.children[i],
            newnode.children[i],
            i
          );
      }
    }
  }
}

/**
 * The createDOMNode function takes our JSON representation (the one we created using the getRenderFunction() method) of the DOM
 * and converts it into an actual DOM node.
 * 
 * It's pretty simple. Let's go inside the function.
 */
function createDOMNode(dom) {
  // First we check if the node is a string.
  // That means, it is a text node and does not have any children.
  // So let's just create the text node
  if (typeof dom === "string") {
    return document.createTextNode(dom);
  }

  // If the node isn't a string then we create the element node using the type in our JSON.
  var newEl = document.createElement(dom.type);

  if (dom.events) { // If our node has events attached, then we attach event listeners to the element
    Object.keys(dom.events).forEach(event => {
      newEl.addEventListener(event, dom.events[event]);
    });
  }

  if (dom.attrs) { // Then we take our html attributes and add them to the element
    Object.keys(dom.attrs).forEach(attr => {
      newEl.setAttribute(attr, dom.attrs[attr]);
    });
  }

  // Great. Now it's time for the child nodes.
  if (dom.children && dom.children.length > 0) {
    // This just checks if the node has children
    // Now, let's loop through all the children of the node and call the same createDOMNode function
    // on each one of them
    // Then, append the returned function to immediate parent element we just created.
    dom.children.forEach(function(element) {
      var innerElement = createDOMNode(element);
      newEl.appendChild(innerElement);
    }, this);
  }
  // When all is done, return the element
  return newEl;
}


/**
 * The diffNodes function takes two JSON representations of our nodes or trees and returns true or false
 * true meaning the nodes are different, and false meaning they're not
 * 
 * Let's again go inside this function and see how it works
 */
function diffNodes(oldnode, newnode) {
  if (oldnode && newnode) {
    if (typeof oldnode != typeof newnode) {
      // If the type of both nodes is different
      // One is a text node and the other is an element
      return true;
    } else if (oldnode.type && newnode.type && oldnode.type != newnode.type) {
      // If both nodes are elements, but are different.
      return true;
    } else if (
      typeof oldnode === "string" &&
      typeof newnode === "string" &&
      newnode != oldnode
    ) {
      // If both nodes are string and are not equal
      return true;
    }
    return false;
  } else {
    throw new Error("Nodes are undefined");
  }
}
