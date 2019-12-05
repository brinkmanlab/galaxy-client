=========================
Galaxy web client library
=========================

A Vue based library containing a collection of components to interact with Galaxies API

The API is abstracted using Vuex-ORM into a set of classes that provide interfaces for the various functionality.

**This library is a work in progress and is being actively developed, the interface may change at any time without warning.**

See [CONTRIBUTING](CONTRIBUTING.rst) for information on how to contribute and various aspects of the libraries design.


Required Galaxy modification
----------------------------

Currently Galaxies API does not allow user creation, a simple modification to Galaxies code is required in order to enable this. See https://github.com/galaxyproject/galaxy/issues/8752