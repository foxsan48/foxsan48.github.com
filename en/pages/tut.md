# Getting Started in WebAssembly, with C++ (CPP)
This is an introduction to [WebAssembly](http://webassembly.org/), in the browser using [Emscripten](http://kripken.github.io/emscripten-site/).

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
Now if you try to compile this as before we will get an error `warning: unresolved symbol: print_js` which is expected, so let's link the library in with this
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

#### Written by Charlotte Lily Fields
Want to give me feedback or support me in writing more? You can do so here:
- [Twitter @Foxsan48](https://twitter.com/Foxsan48)
- [Ko-Fi/Charlotte](https://ko-fi.com/charlotte)
- [Patreon](https://www.patreon.com/CharlotteFields)

[Written with the help of the Markdown editor from JBT](https://jbt.github.io/markdown-editor/)