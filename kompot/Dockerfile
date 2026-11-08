FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S kompot && adduser -S kompot -G kompot
COPY --from=build /src/target/kompot-0.0.1-SNAPSHOT.jar app.jar
USER kompot
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
