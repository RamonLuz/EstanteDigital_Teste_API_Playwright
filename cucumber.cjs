module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: ['features/support/**/*.ts', 'features/step-definitions/**/*.ts'],
    format: [
      'progress',
      'html:test-results/cucumber-report.html',
      'junit:test-results/cucumber-junit.xml',
    ],
    parallel: 1,
    publishQuiet: true,
  },
};
