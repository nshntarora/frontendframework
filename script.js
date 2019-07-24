function render(type, attributes, children) {
  return {
    type,
    ...attributes,
    children
  };
}

const rootComponent = {
  state: {
    name: ""
  },
  render(h) {
    return h("div", {}, [
      h("input", {
        events: {
          input: e => {
            this.name = e.target.value;
          }
        },
        attrs: {
          value: this.name
        }
      }),
      this.name,
      childComponent.render(h)
    ]);
  }
};

function makeReactive(component) {
  const reactiveComponent = JSON.parse(JSON.stringify(component));
  reactiveComponent.render = component.render;

  Object.keys(reactiveComponent.state).forEach(stateKey => {
    Object.defineProperty(reactiveComponent, stateKey, {
      get() {
        return this.state[stateKey] || " ";
      },
      set(value) {
        const olddom = this.render(render);
        this.state[stateKey] = value;
        refreshDOM(olddom, this.render(render));
      }
    });
  });
  return reactiveComponent;
}

const childComponent = {
  render(h) {
    return h("b", {}, ["Hello"]);
  }
};

function createDOMNode(dom) {
  // First we check if the node is a string.
  // That means, it is a text node and does not have any children.
  // So let's just create the text node
  if (typeof dom === "string") {
    return document.createTextNode(dom);
  }
  // If the node isn't a string then we create the element node.
  var newEl = document.createElement(dom.type);

  if (dom.events) {
    Object.keys(dom.events).forEach(event => {
      newEl.addEventListener(event, dom.events[event]);
    });
  }

  if (dom.attrs) {
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

function updateNode(parent, oldnode, newnode, index = 0) {
  // Let's start simple. If the old node does not exist.
  console.log("Update ", oldnode ? oldnode.type : "", oldnode, newnode);
  if (!oldnode) {
    // Then, just simple append the new node
    parent.appendChild(createDOMNode(newnode));
  } else if (!newnode) {
    // If the new node doesn't exist, remove that node
    parent.removeChild(parent.childNodes[index]);
  } else if (diffNodes(oldnode, newnode)) {
    // If both the nodes exist. Check if the new node is different.
    // If they are, then replace the old node with the new node

    parent.replaceChild(createDOMNode(newnode), parent.childNodes[index]);
  } else if (newnode.type) {
    // If the old and new nodes haven't changed, check if their children have changed
    // Recursion to the rescue. Loop through all children and call this function on each one of them.

    if (oldnode.attrs !== newnode.attrs) {
      // console.log("Attributes are changed", parent, parent.childNodes[index]);
      if (parent.childNodes[index]) {
        Object.keys(oldnode.attrs).forEach(attr => {
          parent.childNodes[index].removeAttribute(attr);
        });
        Object.keys(newnode.attrs).forEach(attr => {
          parent.childNodes[index].setAttribute(attr, newnode.attrs[attr]);
        });
      }
    }

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

function renderRoot() {
  var root = document.getElementById("app");
  // console.log(makeReactive(rootComponent));
  updateNode(root, null, makeReactive(rootComponent).render(render));
}

document.addEventListener("DOMContentLoaded", () => {
  renderRoot();
});

// This function is called when you click on reload
// It makes some changes to the old dom to get the new dom representation
// Then, just calls the updateNode function with both the doms
function refreshDOM(olddom, newdom) {
  var root = document.getElementById("app");
  updateNode(root, olddom, newdom);
}
