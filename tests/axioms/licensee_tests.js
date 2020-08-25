// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const commandExists = require('command-exists').sync
const path = require('path')
const chai = require('chai')
const expect = chai.expect

describe('licensee', () => {
  const licenseeInstalled = commandExists('licensee')

  if (!licenseeInstalled) {
    it.skip('tests licensee functionality', () => {})
  } else {
    const licenseeAxiom = require('../../axioms/licensee')

    it('runs licensee', () => {
      const mockFs = { targetDir: path.resolve(__dirname, '../../') }
      const res = licenseeAxiom(mockFs)

      expect(res.passed).to.equal(true)
      expect(res.targets).to.have.length(1)
      expect(res.targets[0].path).to.equal('Apache-2.0')
    })

    it('returns nothing if no licenses are found', () => {
      const mockFs = { targetDir: path.resolve(__dirname) }
      const res = licenseeAxiom(mockFs)

      expect(res.passed).to.equal(true)
      expect(res.targets).to.have.length(0)
    })
  }
})
