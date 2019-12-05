============
Contributing
============

Contributions are welcome.

Submit contributions as a pull request on GitHub.

Design Guidelines
-----------------

- Vue components do not directly interact with the API. All API logic must be done in the ORM.
- Vue components contain CSS that describes layout only. All CSS that describes color, font, or any application specific layout modifications must be provided outside the component by the importing project or template.
- Reuse components as much as possible, even if it requires using CSS to completely transform the layout of the component. A good example is how WorkflowInvocation transforms the History component into a table row rather than directly implementing rows that refer to the history ORM.


Repository structure
--------------------

All ORM classes are located in `src/api/` and loosely follow Galaxies API paths. Some API endpoints are consolidated into related classes as it was not reasonable to independently represent them.

All Vue modules exist in directories named after the feature of Galaxy they represent.

`src/misc/` contains generally useful components and are used to build other components.