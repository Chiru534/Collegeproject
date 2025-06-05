router.post('/login', async (req, res) => {
  const { roll, password } = req.body;
  const user = await User.findOne({ roll });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ 
    message: 'Login successful', 
    roll: user.roll, 
    isAdmin: user.isAdmin, 
    token: 'dummy-token' 
  });
});