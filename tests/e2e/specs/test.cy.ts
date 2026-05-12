describe('Weather app', () => {
  it('loads the home screen from index', () => {
    cy.visit('/')
    cy.get('ion-title', { timeout: 15000 }).should('contain.text', 'Weather')
    cy.contains('Jakarta area', { timeout: 15000 }).should('be.visible')
  })
})
