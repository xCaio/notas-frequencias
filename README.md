# Sistema de Notas e Frequência – Professor Carlos

Este projeto é um aplicativo criado em **React Native + Expo**, permitindo que o professor Carlos cadastre alunos, notas, frequências e obtenha estatísticas da turma.

---

## 📌 **1. Instruções para executar o sistema**

### **Pré-requisitos**

* Node.js instalado
* Expo CLI
* Dispositivo Android/iOS ou Emulador

### **Passos de instalação e execução**

1. Clone ou copie o projeto:

```
git clone https://github.com/xCaio/notas-frequencias.git
```

2. Entre na pasta do projeto:

```
cd notas-frequencias
```

3. Instale as dependências:

```
npm install
```

4. Execute o projeto:

```
npx expo start
```

5. Abra no celular usando o app **Expo Go**.

---

## 📌 **2. Premissas assumidas**

* Cada aluno possui **5 disciplinas fixas**.
* Notas variam de **0 a 10**.
* Frequência varia de **0% a 100%**.
* Os dados são armazenados localmente usando **AsyncStorage**.
* O professor acessa o sistema por um único dispositivo.

---

## 📌 **3. Decisões de projeto**

### ✔ **Uso do React Native + Expo**

Facilita o desenvolvimento e execução do aplicativo sem configurações complexas de ambiente.

### ✔ **Interface construída com componentes padrão do React Native**

Elimina dependências extras e mantém o projeto simples.

### ✔ **Armazenamento local com AsyncStorage**

Permite que os dados fiquem salvos mesmo ao fechar o aplicativo.

### ✔ **Cálculos automáticos implementados no app**

* Média individual do aluno
* Média da turma por disciplina
* Frequência geral do aluno
* Identificação de alunos:

  * acima da média geral
  * com frequência menor que 75%
