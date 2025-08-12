import importlib


def test_info_prints_with_prefix(capsys):
    from src.utils import logger

    logger.info("hello")
    captured = capsys.readouterr()
    assert captured.out == "[ComfyUI-Asset-Manager] hello\n"
    assert captured.err == ""


def test_error_prints_to_stderr_with_prefix(capsys):
    from src.utils import logger

    logger.error("oops")
    captured = capsys.readouterr()
    assert captured.err == "[ComfyUI-Asset-Manager] oops\n"
    assert captured.out == ""


def test_variadic_args_joined_with_space(capsys):
    from src.utils import logger

    logger.info("a", 1, "b")
    captured = capsys.readouterr()
    assert captured.out == "[ComfyUI-Asset-Manager] a 1 b\n"


def test_custom_sep_and_end(capsys):
    from src.utils import logger

    logger.log("x", "y", "z", sep="-", end="END")
    captured = capsys.readouterr()
    assert captured.out == "[ComfyUI-Asset-Manager] x-y-zEND"


def test_prefix_constant():
    from src.utils import logger

    # Ensure the prefix is exposed and correct
    assert logger.PREFIX == "[ComfyUI-Asset-Manager]"


