import OmniAural, { initGlobalState } from "../src/OmniAural"
import MyOmniObject from "./MyOmniObject";
import mockInitialState from "./mockInitialState";
initGlobalState(mockInitialState)

const controller1 = new MyOmniObject()
const controller2 = new MyOmniObject()

const originalLog = console.log
let consoleOutput = []
const mockedLog = output => consoleOutput.push(output)
describe("Omni object singleton", () => {
    afterEach(() => {
        console.log = originalLog
        consoleOutput = []
    })

    beforeEach(() => (console.log = mockedLog))

    test('should have one global object instance for all declared instances', () => {
        expect(controller1.omniId === controller2.omniId).toBeTruthy()
    })

    test('should update state on all instances from one global state update call', () => {
        expect(controller1.state.dev_mode).toBeFalsy()
        expect(controller1.state.dev_mode === controller2.state.dev_mode).toBeTruthy()
        OmniAural.state.dev_mode.set(true)
        expect(controller1.state.dev_mode).toBeTruthy()
        expect(controller1.state.dev_mode === controller2.state.dev_mode).toBeTruthy()
    })

    describe('"stateChanged" function', () => {
        test('should be passed a top level object when updating top level properties', () => {
            expect(controller1.state.dev_mode).toBeTruthy()
            OmniAural.state.dev_mode.set(false)
            expect(controller1.state.dev_mode).toBeFalsy()
            expect(consoleOutput).toEqual([
                "Changes: {\"dev_mode\":false}"
            ])
        })

        test('should be passed a whole object when updating nested level properties', () => {
            expect(controller1.state.account.address.street === "Randolph").toBeTruthy()
            expect(controller1.state.account.address.city === "Chicago").toBeTruthy()
            OmniAural.state.account.address.street.set("Clark")
            expect(controller1.state.account.address.street === "Clark").toBeTruthy()
            expect(controller1.state.account.address.city === "Chicago").toBeTruthy()
            expect(consoleOutput).toEqual([
                "Changes: {\"account\":{\"address\":{\"street\":\"Clark\"}}}"
            ])
        })
    })
})