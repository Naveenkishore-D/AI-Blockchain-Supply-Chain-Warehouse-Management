// Sample Unit Test for Warehouse logic
describe('Warehouse Service', () => {
  it('should validate warehouse capacity', () => {
    const capacity = 50000;
    const used = 14200;
    expect(capacity >= used).toBe(true);
  });
});
