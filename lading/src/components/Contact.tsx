import { Mail, Phone, MessageCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const Contact = () => {
  return (
    <section id="contato" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-card rounded-2xl shadow-card p-8 md:p-12">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-6 text-gradient-gold">
            Entre em Contato
          </h2>
          
          <p className="text-lg text-muted-foreground text-center mb-10">
            Quer saber mais sobre nossos programas ou trazer o FOR UP Education para sua cidade? Fale conosco.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <a 
              href="mailto:contato@forupeducation.com.br" 
              className="flex flex-col items-center p-6 bg-secondary/50 rounded-xl hover:bg-secondary transition-all duration-300 group w-full"
            >
              <Mail className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-muted-foreground text-center">E-mail</span>
              <span className="text-foreground font-medium text-center mt-1 whitespace-normal md:whitespace-nowrap">
                contato@forupeducation.com.br
              </span>
            </a>

            <a 
              href="tel:+5511976747650" 
              className="flex flex-col items-center p-6 bg-secondary/50 rounded-xl hover:bg-secondary transition-all duration-300 group w-full"
            >
              <Phone className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-muted-foreground">Telefone</span>
              <span className="text-foreground font-medium mt-1">(11) 97674-7650</span>
            </a>

            <a 
              href="https://wa.me/5511976747650" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center p-6 bg-secondary/50 rounded-xl hover:bg-secondary transition-all duration-300 group w-full"
            >
              <MessageCircle className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-muted-foreground">WhatsApp</span>
              <span className="text-foreground font-medium mt-1">Enviar mensagem</span>
            </a>
          </div>

          <div className="flex justify-center">
            <WhatsAppButton variant="hero" size="lg" label="Falar no WhatsApp" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
