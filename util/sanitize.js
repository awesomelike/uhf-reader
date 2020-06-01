const sanitizeSet = (set) => {
  setTimeout(() => {
    set.clear();
    sanitizeSet(set);
  }, 30 * 1000);
}

module.exports = sanitizeSet;