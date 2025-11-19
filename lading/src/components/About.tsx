const About = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card rounded-2xl shadow-card p-8 md:p-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-8 text-gradient-gold">
            Sobre o Instituto ForUp Education
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
            O Instituto ForUp Education nasceu com o propósito de inspirar e formar pessoas que desejam evoluir integralmente — no pensamento, na liderança e na ação. 
            Nossos programas unem formação humana, valores e prática aplicada à vida profissional.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
