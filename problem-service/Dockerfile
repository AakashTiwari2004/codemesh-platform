FROM eclipse-temurin:17-jdk-jammy
COPY target/*.jar /tmp/
RUN cp "$(find /tmp -maxdepth 1 -type f -name '*.jar' ! -name '*.jar.original' | head -n 1)" /app.jar && rm -rf /tmp/*
ENTRYPOINT ["java","-jar","/app.jar"]
