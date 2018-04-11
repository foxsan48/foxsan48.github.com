---
title: "Getting Started in WebAssembly, with C++"
description: "This is an introduction to WebAssembly, in the browser using Emscripten"
draft: "true"
locale: "en-US"
date: 2018-04-11T11:46:22+10:00
parent: "tutorials"
slug: "Getting Started in WebAssembly, with CPP"
---
[//]: # (# Getting Started in WebAssembly, with C++ (CPP))
This is an introduction to [WebAssembly](http://webassembly.org/), in the browser using [Emscripten](http://kripken.github.io/emscripten-site/).
<!--more-->

## Firstly, why did I make this article?
I found that there was a lack of tutorials and/or information in one easy to understand place, so I decided to make this.



I hope you find it helpful.
##### Note this is written for Linux/OSX
I will update this for Windows as soon as I can, but it shouldn't be too hard using the information on the WebAssembly site.

## Let's get started shall we?
Okay so, firstly we'll need to get the Emsdk (development tools for WebAssembly) instructions to doing so can be found [here on the WebAssembly site](http://webassembly.org/getting-started/developers-guide/) but I'll copy them here so you can get all the information in one place.

Let's check we have the dependencies:

- Git
- Cmake
- GCC/XCode
- Python 2.7.x (installed on most Linux & OSX systems by default.)

If you don't have these installed use your package manager to get them `apt` or `brew` for OSX or whatever package manager you have for Linux. 

`xcode-select --install` for xcode

## Installing the Emsdk

Let's get the repository we need and compile the tools!
```
$ git clone https://github.com/juj/emsdk.git
$ cd emsdk
$ ./emsdk install latest
$ ./emsdk activate latest
```
After this you'll see a prompt asking you to do `source emsdk_env.sh`, which sets up the environment paths for the SDK. I suggest adding it to your `bashrc` (or your setup env vars for your terminal) just to make things easier in terms of not having to remember it each time.

## Using the Emsdk

Now let's compile something to check it's all working as expected
for this I'll assume you have a directory for playing with this in so let's make a directory under that for this test run and to get you used to the software
```
$ mkdir test
$ cd test
$ touch test.cpp
```
then open `test.cpp` in your code editor of choice and copy this file into it.
```cpp
#include <iostream>

extern "C" {
    int main() {
        std::cout << "Hello, World!" << std::endl;
        return 0;
    }
}
```
Then we can compile it with a nice one-liner, and run it with one more.
```
$ em++ -s WASM=1 -o test.html test.cpp
$ emrun test.html
```
Now let me explain this a bit, if you have done C++ before most of this may make sense.

For functions to be accessible outside of the binary they need to be wrapped in `extern "C"` this tells the compiler not to mangle the name, I don't know much about it but it's necessary you can read up on it more [here](https://en.wikipedia.org/wiki/Name_mangling).

##### Wait, what is this massive JavaScript file?

If you look in the directory we compiled that code in you'll see a file called `test.js` which is rather large, I haven't looked into it too much yet but it is necessary for setting up the environment for WebAssembly to run in, also includes polyfills, my more JS inclined friends told me. 
I'll look into it more at some point.

## Let's do something more interesting
Now that is very nice and all but it's just printing a string to the console, let's get something a bit more interesting, passing data between JavaScript and C++.

Let's change that `test.cpp` to pass a string from it, to JS and print it
```cpp
#include <string>

extern "C" {
    extern void print_js(char *);

    char test;
    int main() {
        strncpy(&test,"Hello, World!", 16);
        print_js(&test);
        return 0;
    }
}
```
But one moment, where is that `print_js` defined I hear you ask, in this next file I've called `lib.js` as it supplies supporting code.
```javascript
//lib.js
mergeInto(LibraryManager.library, { // template part
    print_js: function(str) { // Our code!
        console.log(str);
    }
}); // template part
```
Now if you try to compile this as before we will get an error `warning : unresolved symbol: print_js` which is expected, so let's link the library in with this

Note: There is a space between `warning` and `:` because I couldn't work out how to escape it on MDWiki.

```
$ em++ -s WASM=1 --js-library lib.js -o test.html main.cpp
```
Now if we run this as before you'll notice something, no output on screen, instead the output will only be in the JS console, which you can access with `Ctrl+Shift+K` in Firefox.

Wait, but what's this? all you get is a number, the reason for this is in C and C++ strings are a pointer to the first character, and the continues until you hit `\0` the end of a string. So we need to tell Javascript that, thankfully WebAssembly makes that easy, giving JS full access to WASM's memory, so let's fix our `lib.js` to deal with this
```javascript
mergeInto(LibraryManager.library, {
    print_js: function (p) { // p for pointer
        let h = Module.HEAPU8; // Access to memory as unsigned 8 bit/byte groups
        let s = "";
        for (i = p; h[i]; i++) { // continues until h[i] = 0, the end of a string in C/C++
          s += String.fromCharCode(h[i]);
        }
        console.log(s);
    },
  });
```
And if we compile that again, we'll get `Hello, World!` in the JS console! So now we have strings being sent one way, how about back to C++/WASM from Javascript? Let's get on to this.

We need to make a change to our `lib.js` so we can store the location of the string's first character, so change it as follows
```javascript
mergeInto(LibraryManager.library, {
  print_js: function (p) {
    let h = Module.HEAPU8;
    let s = "";
    for (i = p; h[i]; i++) {
      s += String.fromCharCode(h[i]);
    }
    console.log(s);
    //return s;
  },
  stringPointer: function(p) {
    window.stringLocation = p;
  }
});
```

Which just stores the pointer passed to it in a global variable called stringLocation. Now we need to call this from our C++ code passing the pointer to string, which is a small change to our original code.

```cpp
#include <string>

extern "C" {
    extern void print_js(char *);
    extern void stringPointer(char *);


    char js_str;
    int main() {
        stringPointer(&js_str);
        strncpy(&js_str,"Hello, World!", 20);
        print_js(&js_str);
        return 0;
    }
}
```

Then we need to add a new file, so it's easier to call functions defined in `lib.js` and so we can access WebAssembly stuff like memory.

Create a file called `post.js` and fill it with this:
```javascript
function setString_js(str){
    let h = Module.HEAPU8;
    let p = window.stringLocation;
    for(i = 0; i < str.length; i++){
        h[p+i] = str[i].charCodeAt(0);
    }
    h[p+str.length] = 0;
}

/*
This function makes it possible to call print_js func.
from pure JS easily.
*/
function print_js() {
    Module.asmLibraryArg._print_js(window.stringLocation);
}
```
`Module.asmLibraryArg._<func_name>` is how we access functions defined in `lib.js` and the first function in here writes to the stringLocation, character by character and then terminates with a `\0` as defined by the C/C++ string spec.

Then compiling this we just need to add one more arg.

```
$ em++ -s WASM=1 --js-library lib.js --post-js post.js -o test.html main.cpp
```

And then by using the js console you can call
```javascript
setString_js("testing")
print_js();
//testing
```

And there you have it passing a string, to actually use this in C++ you'd have to call a function telling it to read the string into another location to be kept, but for the purpose of this tutorial let's just echo it out.

The change to our C++ code is rather small, adding another function to be called when JS changes the string.
```cpp
#include <iostream>
#include <string>

extern "C" {
    extern void print_js(char *);
    extern void stringPointer(char *);


    char js_str;
    int main() {
        stringPointer(&js_str);
        strncpy(&js_str,"the text you want", 20);
        print_js(&js_str);
        return 0;
    }

    void print_str(char * str) {
        std::cout << str << std::endl;
    }
}
```
and a one line change to our `post.js`
```javascript
function setString_js(str){
    let h = Module.HEAPU8;
    let p = window.stringLocation;
    for(i = 0; i < str.length; i++){
        h[p+i] = str[i].charCodeAt(0);
    }
    h[p+str.length] = 0;
    Module._print_str(window.stringLocation);
}

function print_js() {
    Module.asmLibraryArg._print_js(window.stringLocation);
}
```
This is something new to us now, `Module._print_str(...)` which is how we call WASM functions from Javascript.
this requires one more change to our compiling command
```
$ em++ -s WASM=1 --js-library lib.js --post-js post.js -s EXPORTED_FUNCTIONS='["_main","_print_str"]' -o index.html main.cpp
```
So you add functions to be used or accessed outside of the C++ code, prepending `_` there is an alternate way of doing this by using
```cpp
#include <emscripten.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int main() {
        stringPointer(&js_str);
        strncpy(&js_str,"the text you want", 20);
        print_js(&js_str);
        return 0;
    }
}
```
which then gets rid of the need of `-s EXPORTED_FUNCTIONS` all together.

Anyway as you run this you'll see it all works as expected.

Now we've dealt with passing strings back and forth, from now onwards I'll stop supplying the whole files when I make changes, I'll just specify where they are.

## Booleans

For booleans, they are represented by `0` and `1` in C/C++, the code I used to do this is

```cpp
//...
extern void boolPointer(bool *);

bool js_bool;
int main() {
    //...
    js_bool = true;
    get_bool_js(&js_bool);
    //...
}
```
and added to `lib.js`
```javascript
boolPointer: function(p) {
    window.boolLocation = p;
},
get_bool_js: function(p) {
    let h = Module.HEAPU8;
    console.log(h[p]);
}
```
and then for sending booleans back to WASM, added this to `post.js`
```javascript
function setBool_js(bool) {
    let h = Module.HEAPU8;
    let p = window.stringLocation;
    if (bool) {
        h[p] = 1;
    } else {
        h[p] = 0;
    }
}
```

And that is booleans done! 
On to numbers now (as I write this, I haven't done this yet and I fear this being tricky)
## Numbers!
### Floats
Added to `main.cpp`
```cpp
// ...
extern void floatPointer(float *);
extern void get_float_js(float *);
// ...
js_float = 3.141;
get_float_js(&js_float);
```
and then to `lib.js`
```javascript
floatPointer: function(p) {
    window.floatLocation = p;
},
get_float_js: function(p) {
    let dv = new DataView(Module.wasmMemory.buffer);
    console.log(dv.getFloat32(p, true)); 
    // true or false depends on your OS so you may need to tweak this
}
```
[Information on DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/getFloat32)
Then to set the float in `post.js` is a few lines
```javascript
function setFloat_js(f_val) {
    let dv = new DataView(Module.wasmMemory.buffer);
    dv.setFloat32(window.floatLocation, f_val, true);
}
```

## Written by Charlotte Lily Fields
Want to give me feedback or support me in writing more? You can do so here:

<a class="twitter-follow-button" data-show-count=false
  href="https://twitter.com/Foxsan48">
Follow @Foxsan48</a>

- [View my Twitter @Foxsan48](https://twitter.com/Foxsan48)
- [Ko-Fi/Charlotte](https://ko-fi.com/charlotte)
- [Patreon](https://www.patreon.com/CharlotteFields)

[Written with the help of the Markdown editor from JBT](https://jbt.github.io/markdown-editor/)