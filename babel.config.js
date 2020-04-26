module.exports = (api) => {
  const module = api.env('module')
  const presetEnv = [
    '@lunde/es',
    {
      env: {
        modules: module ? false : 'commonjs',
        targets: module
          ? {
              browsers: '> 2%',
            }
          : {
              node: '10',
            },
      },
      devExpression: false,
      objectAssign: false,
      restSpread: false,
    },
  ]

  return {
    presets: [['@babel/preset-react', {useSpread: true}], presetEnv],
    plugins: ['optimize-react'],
  }
}
