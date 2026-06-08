module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo automatically adds react-native-worklets/plugin when the
    // package is installed, which Reanimated + gesture-handler (ReanimatedSwipeable
    // swipe-to-delete) require to run code on the UI runtime.
    presets: ['babel-preset-expo'],
  };
};
