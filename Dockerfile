#https://www.balena.io/docs/reference/base-images/base-images-ref/
#FROM balenalib/raspberrypi3:buster
FROM debian:buster-slim

#https://hub.docker.com/r/continuumio/miniconda3/dockerfile
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH /opt/conda/bin:$PATH

#build tools added for xgboost
RUN apt-get update --fix-missing && \
    apt-get install -y wget bzip2 ca-certificates curl git build-essential cmake && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

#https://github.com/jjhelmus/berryconda
RUN wget --quiet https://github.com/jjhelmus/berryconda/releases/download/v2.0.0/Berryconda3-2.0.0-Linux-armv7l.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc

#https://github.com/krallin/tini
ENV TINI_VERSION v0.16.1
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /usr/bin/tini
RUN chmod +x /usr/bin/tini

ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "/bin/bash" ]

#https://anaconda.org/rpi/repo?sort=_name&sort_order=asc&type=conda
RUN conda install -c rpi scipy
RUN conda install -c rpi flask
RUN conda install -c rpi pandas
RUN conda install -c rpi numpy

#https://pypi.org/project/xgboost/
RUN pip install xgboost

COPY ./webapp /app/webapp/
COPY ./data/modelInput /app/data/modelInput/
COPY ./models/*.xgbm /app/models/
COPY ./models/PCA.pkl /app/models/

WORKDIR /app
WORKDIR /app/webapp

ENV FLASK_APP=server.py
ENV FLASK_RUN_PORT=5000
RUN flask run