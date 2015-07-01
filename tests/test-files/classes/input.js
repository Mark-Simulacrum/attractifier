class A {}
class B extends C {}
class B extends C {
    constructor(
        {
            happy = false
        } = {
            happy = true
        } =
        {}) {
        throw new Error(AN_ERROR);
    }
}
