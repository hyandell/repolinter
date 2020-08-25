const path = require('path')
const chai = require('chai')
const cp = require('child_process')
const fs = require('fs')
const stripAnsi = require('strip-ansi')
const repolinter = require(path.resolve('.'))
const expect = chai.expect

/**
 * Execute a command in a childprocess asynchronously. Not secure, but good for testing.
 *
 * @param {string} command The command to execute
 * @param {import('child_process').ExecOptions} [opts] Options to execute against.
 * @returns {Promise<{out: string, err: string, code: number}>} The command output
 */
async function execAsync (
  command,
  opts = {}
) {
  return new Promise((resolve, reject) => {
    cp.exec(command, opts, (err, outstd, errstd) =>
      err !== null && err.code === undefined
        ? reject(err)
        : resolve({
          out: outstd,
          err: errstd,
          code: err !== null ? (err.code) : 0
        })
    )
  })
}

describe('cli', function () {
  const repolinterPath = path.resolve('bin/repolinter.js')
  const selfPath = path.resolve('tests/cli')
  this.timeout(30000)

  it('runs repolinter from the CLI', async () => {
    const expected = stripAnsi(repolinter.defaultFormatter.formatOutput(await repolinter.lint(selfPath), false))
    const actual = await execAsync(`${repolinterPath} lint ${selfPath}`)

    expect(actual.code).to.equal(0)
    expect(actual.out.trim()).to.equals(expected.trim())
  })

  it('produces valid JSON with the JSON formatter', async () => {
    const [actual, actual2] = await Promise.all([
      execAsync(`${repolinterPath} lint ${selfPath} --format json`),
      execAsync(`${repolinterPath} lint ${selfPath} -f json`)
    ])

    expect(actual.code).to.equal(0)
    expect(actual2.code).to.equal(0)
    expect(() => JSON.parse(actual.out)).to.not.throw()
    expect(() => JSON.parse(actual2.out)).to.not.throw()
  })

  it('fixes a problem with dryRun disabled', async () => {
    const actual = await execAsync(`${repolinterPath} lint ${selfPath} --rulesetFile repolinter-other-fix.json`)

    expect(actual.code).to.not.equal(0)
    const fileExists = await fs.promises.access(path.resolve('tests/cli/fixed.txt')).then(() => true).catch(() => false)
    expect(fileExists).to.equal(true)
  })

  it('doesn\'t make any changes with dryRun enabled', async () => {
    const [actual, actual2] = await Promise.all([
      execAsync(`${repolinterPath} lint ${selfPath} -d --rulesetFile repolinter-other-fix.json`),
      execAsync(`${repolinterPath} lint ${selfPath} --dryRun --rulesetFile repolinter-other-fix.json`)
    ])

    expect(actual.code).to.not.equal(0)
    expect(actual2.code).to.not.equal(0)
    const fileExists = await fs.promises.access(path.resolve('tests/cli/fixed.txt')).then(() => true).catch(() => false)
    expect(fileExists).to.equal(false)
  })

  it('runs repolinter from the CLI using a config file', async () => {
    const expected = stripAnsi(repolinter.defaultFormatter.formatOutput(await repolinter.lint(selfPath, undefined, false, 'repolinter-other.json'), false))
    const [actual, actual2, actual3] = await Promise.all([
      execAsync(`${repolinterPath} lint ${selfPath} -r repolinter-other.json`),
      execAsync(`${repolinterPath} lint ${selfPath} --rulesetFile repolinter-other.json`),
      execAsync(`${repolinterPath} lint ${selfPath} --ruleset-file repolinter-other.json`)
    ])

    expect(actual.code).to.equal(0)
    expect(actual2.code).to.equal(0)
    expect(actual3.code).to.equal(0)
    expect(actual.out.trim()).to.equals(expected.trim())
    expect(actual2.out.trim()).to.equals(expected.trim())
    expect(actual3.out.trim()).to.equals(expected.trim())
  })

  it('runs repolinter on a remote git repository', async () => {
    const [actual, actual2] = await Promise.all([
      execAsync(`${repolinterPath} lint --git https://github.com/prototypicalpro/repolinter.git`),
      execAsync(`${repolinterPath} lint -g https://github.com/prototypicalpro/repolinter.git`)
    ])

    expect(actual.code).to.equal(0)
    expect(actual2.code).to.equal(0)
    expect(actual.out.trim()).to.contain('Lint:')
    expect(actual2.out.trim()).to.contain('Lint:')
  })

  it('runs repolinter using a remote ruleset', async () => {
    const expected = stripAnsi(repolinter.defaultFormatter.formatOutput(await repolinter.lint(selfPath, [], false, 'repolinter-other.json'), false))
    const [actual, actual2, actual3] = await Promise.all([
      execAsync(`${repolinterPath} lint ${selfPath} --rulesetUrl https://raw.githubusercontent.com/prototypicalpro/repolinter/master/tests/cli/repolinter-other.json`),
      execAsync(`${repolinterPath} lint ${selfPath} --ruleset-url https://raw.githubusercontent.com/prototypicalpro/repolinter/master/tests/cli/repolinter-other.json`),
      execAsync(`${repolinterPath} lint ${selfPath} -u https://raw.githubusercontent.com/prototypicalpro/repolinter/master/tests/cli/repolinter-other.json`)
    ])

    expect(actual.code).to.equal(0)
    expect(actual2.code).to.equal(0)
    expect(actual3.code).to.equal(0)
    expect(actual.out.trim()).to.equals(expected.trim())
    expect(actual2.out.trim()).to.equals(expected.trim())
    expect(actual3.out.trim()).to.equals(expected.trim())
  })

  afterEach(async () => {
    return fs.promises.unlink(path.resolve('tests/cli/fixed.txt')).catch(() => {})
  })
})
